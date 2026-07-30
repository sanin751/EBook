const request = require('supertest');
const app = require('../src/app');
const AddressModel = require('../src/models/Address');
const { createUserAndToken } = require('./helpers');

const sample = {
  fullName: 'Jane Doe',
  phone: '9800000000',
  street: '123 Reader Ave',
  city: 'Kathmandu',
  country: 'Nepal',
};

describe('Address API', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/addresses');
    expect(res.status).toBe(401);
  });

  it('creates and lists addresses scoped to the user', async () => {
    const { token: tokenA } = await createUserAndToken();
    const { token: tokenB } = await createUserAndToken();

    await request(app).post('/api/v1/addresses').set('Authorization', `Bearer ${tokenA}`).send(sample);

    const listA = await request(app).get('/api/v1/addresses').set('Authorization', `Bearer ${tokenA}`);
    expect(listA.body.data.addresses).toHaveLength(1);

    const listB = await request(app).get('/api/v1/addresses').set('Authorization', `Bearer ${tokenB}`);
    expect(listB.body.data.addresses).toHaveLength(0);
  });

  it('only allows one default address at a time', async () => {
    const { token } = await createUserAndToken();

    const first = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sample, isDefault: true });
    const second = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sample, city: 'Bhaktapur', isDefault: true });

    expect(second.body.data.address.isDefault).toBe(true);

    const list = await request(app).get('/api/v1/addresses').set('Authorization', `Bearer ${token}`);
    const firstFromList = list.body.data.addresses.find((a) => a._id === first.body.data.address._id);
    expect(firstFromList.isDefault).toBe(false);
  });

  it('updates and deletes an address, rejecting cross-user access', async () => {
    const { token: owner } = await createUserAndToken();
    const { token: other } = await createUserAndToken();

    const createRes = await request(app).post('/api/v1/addresses').set('Authorization', `Bearer ${owner}`).send(sample);
    const addressId = createRes.body.data.address._id;

    const crossUpdate = await request(app)
      .put(`/api/v1/addresses/${addressId}`)
      .set('Authorization', `Bearer ${other}`)
      .send({ city: 'Pokhara' });
    expect(crossUpdate.status).toBe(404);

    const updateRes = await request(app)
      .put(`/api/v1/addresses/${addressId}`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ city: 'Pokhara' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.address.city).toBe('Pokhara');

    const crossDelete = await request(app)
      .delete(`/api/v1/addresses/${addressId}`)
      .set('Authorization', `Bearer ${other}`);
    expect(crossDelete.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/addresses/${addressId}`)
      .set('Authorization', `Bearer ${owner}`);
    expect(deleteRes.status).toBe(200);
  });

  it('rejects an address missing required fields', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Jane' });
    expect(res.status).toBe(400);
  });

  it('encrypts phone and street at rest but returns them decrypted via the API', async () => {
    const { token } = await createUserAndToken();
    const createRes = await request(app).post('/api/v1/addresses').set('Authorization', `Bearer ${token}`).send(sample);
    const addressId = createRes.body.data.address._id;

    expect(createRes.body.data.address.phone).toBe(sample.phone);
    expect(createRes.body.data.address.street).toBe(sample.street);

    const rawDoc = await AddressModel.findById(addressId).lean();
    expect(rawDoc.phone).not.toBe(sample.phone);
    expect(rawDoc.street).not.toBe(sample.street);
    expect(rawDoc.phone).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

    const listRes = await request(app).get('/api/v1/addresses').set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.addresses[0].phone).toBe(sample.phone);
  });
});

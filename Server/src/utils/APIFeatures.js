class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query object
    this.queryString = queryString; // req.query object
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/(gte|gt|lte|lt)/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this; // Return the object to allow chaining
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort if none specified (e.g., by creation date descending)
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Default: exclude __v field
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // default page 1
    const limit = this.queryString.limit * 1 || 100; // default limit 100
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // We might want to check if page requested exceeds total pages, but that requires executing countDocuments separately
    // if (this.queryString.page) {
    //   const numDocuments = await this.query.model.countDocuments();
    //   if (skip >= numDocuments) throw new Error('This page does not exist');
    // }

    return this;
  }
}

module.exports = APIFeatures; 
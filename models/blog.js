const { type } = require('jquery');
const mongoose = require('mongoose');

const blogschema = mongoose.Schema({
  blog_meta_title:
  {
    type: String
  },
  blog_meta_description:
  {
    type: String
  },
  blog_meta_keywords:
  {
    type: String
  },
  blog_schema:
  {
    type: String
  },
  blog_ai: {
    type: [String]
  },

  blog_faq: [
    {
      question: {
        type: String
      },
      answer: {
        type: String
      }
    }
  ],
  blog_title:
  {
    type: String
  },
  blog_table_of_contents: {
    type: [String]
  },
  blog_link:
  {
    type: String,
    index: true
  },
  blog:
  {
    type: String
  },
  blogimg: {
    type: String
  },
  blog_category: {
    type: String
  },
  blog_key: {
    type: String
  },
  date: {
    type: String,
  },
  created_date: {
    type: String,
  },
  updated_date: {
    type: String,
  },
});

const formatBlogDate = (value) => {
  const d = new Date(value);
  return isNaN(d) ? undefined : d.toLocaleString('en-us', { month: 'long', year: 'numeric', day: 'numeric' });
};

// Exposed in API responses. Older posts have no updated_date, so fall back
// to the publish date.
blogschema.virtual('published').get(function () {
  return formatBlogDate(this.created_date) || this.date;
});
blogschema.virtual('last_updated').get(function () {
  return formatBlogDate(this.updated_date) || formatBlogDate(this.created_date) || this.date;
});
blogschema.set('id', false);
blogschema.set('toJSON', { virtuals: true });

// Matches the { blog_category: X } filter + { _id: -1 } sort used to pull
// the latest N posts per category across the site's landing pages.
blogschema.index({ blog_category: 1, _id: -1 });

module.exports = mongoose.model('blogs', blogschema);
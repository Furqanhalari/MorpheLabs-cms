const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const blog = require('../controllers/blog.controller');

router.use(authenticate);

// Posts
router.get   ('/',                 authorize('posts','read'),    blog.getPosts);
router.get   ('/:id',              authorize('posts','read'),    blog.getPost);
router.post  ('/',                 authorize('posts','create'),  blog.createPost);
router.put   ('/:id',              authorize('posts','update'),  blog.updatePost);
router.patch ('/:id/publish',      authorize('posts','publish'), blog.publishPost);
router.patch ('/:id/unpublish',    authorize('posts','publish'), blog.unpublishPost);
router.delete('/:id',              authorize('posts','delete'),  blog.deletePost);

// Categories
router.get   ('/categories/all',   authorize('posts','read'),   blog.getCategories);
router.post  ('/categories',       authorize('posts','create'), blog.createCategory);
router.put   ('/categories/:id',   authorize('posts','update'), blog.updateCategory);
router.delete('/categories/:id',   authorize('posts','delete'), blog.deleteCategory);

// Tags
router.get   ('/tags/all',         authorize('posts','read'),   blog.getTags);
router.post  ('/tags',             authorize('posts','create'), blog.createTag);
router.delete('/tags/:id',         authorize('posts','delete'), blog.deleteTag);

module.exports = router;

'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useCreateBlog } from '@library/hooks';
import { CreateBlogStyles } from '@styles/section';

export default function CreateBlog() {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useCreateBlog();

  return (
    <Section
      id='create-blog'
      className={CreateBlogStyles.CreateBlog}
    >
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='text'
          placeholder='my-blog-post'
          id='slug'
          label='Slug'
          value={formData.slug}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='https://example.com/image.jpg'
          id='imageUrl'
          label='Image URL'
          value={formData.imageUrl}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='My Blog Post'
          id='title'
          label='Title'
          value={formData.title}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='text'
          placeholder='Short description...'
          id='excerpt'
          label='Excerpt'
          value={formData.excerpt}
          method={handleChange}
          fieldError={fieldError}
          textarea
          rows={3}
        />
        <Input
          type='text'
          placeholder='Full content...'
          id='content'
          label='Content'
          value={formData.content}
          method={handleChange}
          fieldError={fieldError}
          textarea
          rows={10}
        />
        <Input
          type='text'
          placeholder='true/false'
          id='published'
          label='Published'
          value={formData.published}
          method={handleChange}
          fieldError={fieldError}
        />
        <Input
          type='submit'
          value='Create'
        />
      </Form>
    </Section>
  );
}


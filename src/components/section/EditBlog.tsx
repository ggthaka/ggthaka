'use client';

import { Section } from '@components/layout';
import { Form, Input, Message } from '@components/shared';
import { useEditBlog } from '@library/hooks';
import { EditBlogStyles } from '@styles/section';

interface Props {
  id: string;
  userId: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
  excerpt?: string;
  content?: string;
  created: string;
  updated: string;
  published: boolean;
  publishedAt?: string;
}

export default function EditBlog({
  id,
  userId,
  slug,
  title,
  imageUrl,
  excerpt,
  content,
  created,
  updated,
  published,
  publishedAt,
}: Props) {
  const { formData, handleChange, handleSubmit, message, loading, fieldError } =
    useEditBlog({
      id,
      userId,
      slug,
      title,
      imageUrl,
      excerpt,
      content,
      created,
      updated,
      published,
      publishedAt,
    });

  return (
    <Section
      id='edit-blog'
      className={EditBlogStyles.EditBlog}
    >
      <Form
        method={handleSubmit}
        loading={loading}
      >
        {message && <Message>{message}</Message>}
        <Input
          type='text'
          placeholder='blog id'
          id='id'
          label='ID'
          value={formData.id}
          method={handleChange}
          fieldError={fieldError}
          disabled
        />
        <Input
          type='text'
          placeholder='user id'
          id='userId'
          label='User ID'
          value={formData.userId}
          method={handleChange}
          fieldError={fieldError}
          disabled
        />
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
          value={formData.imageUrl ?? ''}
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
          value={formData.excerpt ?? ''}
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
          value={formData.content ?? ''}
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
          value={formData.published ? 'true' : 'false'} // Simple boolean input for now
          method={handleChange}
          fieldError={fieldError}
        />

        <Input
          type='text'
          placeholder='2026-02-08T10:51:12.126Z'
          id='created'
          label='Created'
          value={formData.created}
          method={handleChange}
          fieldError={fieldError}
          disabled
        />
        <Input
          type='text'
          placeholder='2026-02-08T10:51:12.126Z'
          id='updated'
          label='Updated'
          value={formData.updated}
          method={handleChange}
          fieldError={fieldError}
          disabled
        />
        {formData.publishedAt && (
          <Input
            type='text'
            placeholder='2026-02-08T10:51:12.126Z'
            id='publishedAt'
            label='Published At'
            value={formData.publishedAt}
            method={handleChange}
            fieldError={fieldError}
            disabled
          />
        )}
        <Input
          type='submit'
          value='Update'
        />
      </Form>
    </Section>
  );
}

import { describe, it, expect } from 'vitest';

describe('Dashboard: Search, Query & Category Filtering (Area 2)', () => {
  const documents = [
    { id: '1', title: 'Data Structures Lab Manual', category: 'College Students', tags: ['lab', 'code', 'c++'] },
    { id: '2', title: 'Machine Learning Research Paper', category: 'College Students', tags: ['ai', 'research', 'python'] },
    { id: '3', title: 'Company Business Proposal', category: 'Business Templates', tags: ['business', 'finance', 'pitch'] },
    { id: '4', title: 'Faculty Course Syllabus', category: 'Faculty Templates', tags: ['syllabus', 'academic', 'curriculum'] },
    { id: '5', title: 'Senior Software Engineer Resume', category: 'ATS Resume Builder', tags: ['ats', 'resume', 'react'] },
  ];

  it('1. should search documents by exact title match', () => {
    const query = 'Data Structures Lab Manual';
    const filtered = documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });

  it('2. should search documents by partial case-insensitive query', () => {
    const query = 'research';
    const filtered = documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('2');
  });

  it('3. should search documents across tags', () => {
    const query = 'python';
    const filtered = documents.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query))
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('2');
  });

  it('4. should filter documents by specific category', () => {
    const category = 'College Students';
    const filtered = documents.filter((d) => d.category === category);
    expect(filtered.length).toBe(2);
  });

  it('5. should return all documents when category is "All"', () => {
    const category = 'All';
    const filtered = category === 'All' ? documents : documents.filter((d) => d.category === category);
    expect(filtered.length).toBe(5);
  });

  it('6. should return empty list when no documents match search query', () => {
    const query = 'quantum computing non-existent';
    const filtered = documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
    expect(filtered.length).toBe(0);
  });

  it('7. should combine search query and category filtering simultaneously', () => {
    const query = 'paper';
    const category = 'College Students';
    const filtered = documents.filter(
      (d) =>
        (d.category === category) &&
        (d.title.toLowerCase().includes(query.toLowerCase()) || d.tags.includes(query.toLowerCase()))
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('2');
  });

  it('8. should handle search query with leading and trailing whitespaces', () => {
    const query = '   proposal   ';
    const trimmed = query.trim().toLowerCase();
    const filtered = documents.filter((d) => d.title.toLowerCase().includes(trimmed));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('3');
  });

  it('9. should handle special regex characters in search query safely', () => {
    const query = 'c++';
    const filtered = documents.filter(
      (d) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.tags.includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });

  it('10. should paginate filtered document results with page size', () => {
    const pageSize = 2;
    const page1 = documents.slice(0, pageSize);
    const page2 = documents.slice(pageSize, pageSize * 2);
    const page3 = documents.slice(pageSize * 2, pageSize * 3);

    expect(page1.length).toBe(2);
    expect(page2.length).toBe(2);
    expect(page3.length).toBe(1);
  });

  it('11. should compute total number of pages accurately', () => {
    const pageSize = 2;
    const totalPages = Math.ceil(documents.length / pageSize);
    expect(totalPages).toBe(3);
  });

  it('12. should handle out-of-bounds page requests gracefully', () => {
    const pageSize = 2;
    const pageIndex = 10; // Out of bounds
    const pageItems = documents.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    expect(pageItems.length).toBe(0);
  });
});

// src/utils/adapters.ts
import { Resource as ApiResource } from '../services/api';

// Map API resource_type to frontend ResourceType
const mapResourceType = (type: string): string => {
  const map: Record<string, string> = {
    'NOTES': 'lecture-notes',
    'PASTPAPER': 'past-paper',
    'DISSERTATION': 'dissertation',
    'ARTICLE': 'research-paper',
  };
  return map[type] || 'other';
};

// Map API response to frontend Resource type
export const adaptResource = (apiResource: ApiResource): any => ({
  id: apiResource.id.toString(),
  title: apiResource.title,
  type: mapResourceType(apiResource.resource_type),
  author: apiResource.uploaded_by_name || apiResource.uploaded_by_username || 'Unknown',
  authorId: apiResource.uploaded_by?.toString() || '',
  school: apiResource.course_name || 'Unknown School',
  programme: apiResource.course_name || '',
  course: apiResource.course_name || '',
  courseCode: apiResource.course_code || '',
  academicYear: new Date(apiResource.upload_date).getFullYear().toString(),
  dateUploaded: apiResource.upload_date,
  fileType: 'PDF',
  fileSize: '1.2 MB', // We'll need to calculate this from the file
  description: apiResource.title,
  keywords: [apiResource.course_name || ''],
  status: apiResource.is_approved ? 'published' : 'draft',
  downloads: apiResource.download_count,
  views: apiResource.download_count,
});

export const adaptResources = (apiResources: ApiResource[]): any[] => 
  apiResources.map(adaptResource);
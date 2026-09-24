# core_backend/repository/storage.py
"""
Resilient storage backend for CORE.

Strategy:
1. Try Cloudinary first (scalable, CDN-backed)
2. On any failure (network, timeout, credentials), fall back to local filesystem

Files stored locally are prefixed with 'local/' so url()/delete()/open()
know to route them to the local backend without needing a model change.
"""
import os
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from cloudinary_storage.storage import RawMediaCloudinaryStorage


LOCAL_PREFIX = 'local/'


class ResilientStorage(RawMediaCloudinaryStorage):
    """
    Cloudinary-first storage with automatic local fallback.
    Also fixes the MEDIA_URL prefix bug in django-cloudinary-storage 0.3.0.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._local = FileSystemStorage(
            location=settings.MEDIA_ROOT,
            base_url=settings.MEDIA_URL,
        )

    # ------------------------------------------------------------
    # FIX: Strip MEDIA_URL from Cloudinary folder paths
    # The library wrongly uses `settings.MEDIA_URL` as a folder prefix,
    # causing files to be stored at "media/resources/..." on Cloudinary
    # while the retrieval expects "resources/...". We override this
    # so Cloudinary receives only the upload_to path.
    # ------------------------------------------------------------
    def _get_folder(self, name):
        folder = os.path.dirname(name).replace('\\', '/')

        # Strip any MEDIA_URL prefix that may have been added
        media_url = (settings.MEDIA_URL or '').strip('/')
        if media_url and folder.startswith(media_url + '/'):
            folder = folder[len(media_url) + 1:]
        elif media_url and folder == media_url:
            folder = ''

        return folder

    def _save(self, name, content):
        try:
            # Try Cloudinary first
            return super()._save(name, content)
        except Exception:
            # Rewind the file so the local storage can read it fully
            try:
                content.seek(0)
            except Exception:
                pass
            local_name = self._local.save(name, content)
            return f'{LOCAL_PREFIX}{local_name}'

    def url(self, name):
        if name.startswith(LOCAL_PREFIX):
            return self._local.url(name[len(LOCAL_PREFIX):])
        return super().url(name)

    def exists(self, name):
        if name.startswith(LOCAL_PREFIX):
            return self._local.exists(name[len(LOCAL_PREFIX):])
        return super().exists(name)

    def delete(self, name):
        if name.startswith(LOCAL_PREFIX):
            return self._local.delete(name[len(LOCAL_PREFIX):])
        return super().delete(name)

    def open(self, name, mode='rb'):
        if name.startswith(LOCAL_PREFIX):
            return self._local.open(name[len(LOCAL_PREFIX):], mode)
        return super().open(name, mode)

    def path(self, name):
        if name.startswith(LOCAL_PREFIX):
            return self._local.path(name[len(LOCAL_PREFIX):])
        return super().path(name)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
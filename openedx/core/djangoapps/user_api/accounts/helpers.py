"""
Helper functions for the accounts API.
"""
import hashlib

from django.conf import settings
from django.core.files.storage import get_storage_class

PROFILE_IMAGE_SIZES_MAP = {
    'full': 500,
    'large': 120,
    'medium': 50,
    'small': 30
}
_PROFILE_IMAGE_SIZES = PROFILE_IMAGE_SIZES_MAP.values()


def get_profile_image_storage():
    """
    Configures and returns a django Storage instance that can be used
    to physically locate, read and write profile images.
    """
    storage_class = get_storage_class(settings.PROFILE_IMAGE_BACKEND)
    return storage_class(base_url=(settings.PROFILE_IMAGE_DOMAIN + settings.PROFILE_IMAGE_URL_PATH))


def _make_name(username):
    """
    Returns the prefix part of the filename used for all profile images.
    """
    return hashlib.md5(settings.PROFILE_IMAGE_SECRET_KEY + username).hexdigest()


def _get_filename(name, size):
    """
    Returns the full filename for a profile image, given the name prefix and
    size.
    """
    return '{name}_{size}.jpg'.format(name=name, size=size)


def _get_urls(name):
    """
    Returns a dict containing the urls for a complete set of profile images,
    keyed by "friendly" name (e.g. "full", "large", "medium", "small").
    """
    storage = get_profile_image_storage()
    return {
        size_display_name: storage.url(_get_filename(name, size))
        for size_display_name, size in PROFILE_IMAGE_SIZES_MAP.items()
    }


def get_profile_image_names(username):
    """
    Return a dict {size:filename} for each profile image for a given username.
    """
    name = _make_name(username)
    return {size: _get_filename(name, size) for size in _PROFILE_IMAGE_SIZES}


def get_profile_image_urls(user):
    """
    Return a dict {size:url} for each profile image for a given image name.
    Note that based on the value of django.conf.settings.PROFILE_IMAGE_DOMAIN,
    the URL may be relative, and in that case the caller is responsible for
    constructing the full URL if needed.

    Arguments:
        name (str): the base name for the requested profile image.

    Returns:
        dictionary of {size_display_name: url} for each image.

    """
    return _get_urls(_make_name(user.username))


def get_default_profile_image_urls():
    """
    """
    return _get_urls(settings.PROFILE_IMAGE_DEFAULT_FILENAME)

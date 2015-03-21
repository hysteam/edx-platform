"""
Tests for helpers.py
"""
import hashlib
from mock import patch
from unittest import skipUnless

from django.conf import settings
from django.test import TestCase

from openedx.core.djangoapps.user_api.accounts.helpers import get_profile_image_urls, get_default_profile_image_urls
from student.tests.factories import UserFactory

TEST_SIZES = {'full': 50, 'small': 10}

@patch.dict('openedx.core.djangoapps.user_api.accounts.helpers.PROFILE_IMAGE_SIZES_MAP', TEST_SIZES, clear=True)
@skipUnless(settings.ROOT_URLCONF == 'lms.urls', 'Test only valid in lms')
class ProfileImageUrlTestCase(TestCase):
    """
    Tests for profile image URL generation helpers.
    """
    def setUp(self):
        super(ProfileImageUrlTestCase, self).setUp()
        self.user = UserFactory()

    def verify_url(self, actual_url, expected_name, expected_pixels):
        """
        Verify correct url structure.
        """
        self.assertEqual(
            actual_url,
            'http://example-storage.com/profile_images/{0}_{1}.jpg'.format(expected_name, expected_pixels),
        )

    def verify_urls(self, expected_name, actual_urls):
        """
        Verify correct url dictionary structure.
        """
        self.assertEqual(set(TEST_SIZES.keys()), set(actual_urls.keys()))
        for size_display_name, url in actual_urls.items():
            self.verify_url(url, expected_name, TEST_SIZES[size_display_name])

    def test_get_profile_image_urls(self):
        """
        Tests `get_profile_image_urls`
        """
        expected_name = hashlib.md5('secret' + self.user.username).hexdigest()
        actual_urls = get_profile_image_urls(self.user)
        self.verify_urls(expected_name, actual_urls)

    def test_get_default_profile_image_urls(self):
        """
        Tests `get_default_profile_image_urls`
        """
        self.verify_urls('default', get_default_profile_image_urls())
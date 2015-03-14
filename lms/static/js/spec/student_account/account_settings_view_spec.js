define(['backbone', 'jquery', 'underscore', 'js/common_helpers/ajax_helpers', 'js/common_helpers/template_helpers',
        'js/student_account/models/user_account_model', 'js/student_account/views/account_settings_view',
        'js/student_account/views/account_settings_fields'],
    function (Backbone, $, _, AjaxHelpers, TemplateHelpers, UserAccountModel, AccountSettingsView,
              AccountSettingsFieldViews) {
        'use strict';

        describe("Account Settings View", function () {

            var createAccountSettingsView = function (model, data) {

                var accountSettingsView = new AccountSettingsView({
                    el: $('.wrapper-account-settings'),
                    model: model,
                    sections : data.sections
                });
                return accountSettingsView.render().renderFields();
            };

            beforeEach(function () {
                setFixtures('<div class="wrapper-account-settings"></div>');
                TemplateHelpers.installTemplate('templates/fields/field_readonly');
                TemplateHelpers.installTemplate('templates/fields/field_dropdown');
                TemplateHelpers.installTemplate('templates/fields/field_link');
                TemplateHelpers.installTemplate('templates/fields/field_text');
                TemplateHelpers.installTemplate('templates/student_account/account_settings');
            });

            it("can render all sections as expected", function() {

                var model = new UserAccountModel();

                var sectionsData = [
                    {
                        title: "Basic Account Information",
                        fields: [
                            {
                                title: "Username"
                            },
                            {
                                title: "Full Name"
                            }
                        ]
                    },
                    {
                        title: "Additional Information",
                        fields: [
                            {
                                title: "Education Completed"
                            }
                        ]
                    }
                ]

                var sections = [
                    {
                        title: sectionsData[0].title,
                        fields: [
                            {
                                view: new AccountSettingsFieldViews.ReadonlyFieldView({
                                    model: model,
                                    title: sectionsData[0].fields[0].title,
                                    valueAttribute: "username",
                                })
                            },
                            {
                                view: new AccountSettingsFieldViews.TextFieldView({
                                    model: model,
                                    title: sectionsData[0].fields[1].title,
                                    valueAttribute: "name",
                                })
                            }
                        ]
                    },
                    {
                        title: sectionsData[1].title,
                        fields: [
                            {
                                view: new AccountSettingsFieldViews.DropdownFieldView({
                                    model: model,
                                    title: sectionsData[1].fields[0].title,
                                    valueAttribute: "level_of_education",
                                    options: [['s', 'School'], ['u', 'University']],
                                })
                            }
                        ]
                    },
                ]

                var accountSettingsView = createAccountSettingsView(model, {sections: sections, renderFields: true});

                var sectionViews = accountSettingsView.$('.section');
                expect(sectionViews.length).toBe(2);
                _.each(sectionViews, function(sectionView, sectionIndex) {

                    expect($(sectionView).find('.section-header').text().trim()).toBe(sectionsData[sectionIndex].title);

                    var sectionFieldViews = $(sectionView).find('.u-field');
                    expect(sectionFieldViews.length).toBe(sectionsData[sectionIndex].fields.length);

                    _.each(sectionFieldViews, function(sectionFieldView, fieldIndex) {
                        var fieldTitle = $(sectionFieldView).find('.u-field-title').text().trim();
                        expect(fieldTitle).toBe(sectionsData[sectionIndex].fields[fieldIndex].title);
                    });
                });
            });
        });
    });

;(function (define, undefined) {
    'use strict';
    define([
        'gettext', 'jquery', 'underscore', 'backbone', 'js/vendor/backbone-super',
    ], function (gettext, $, _, Backbone) {

        var messageRevertDelay = 4000;
        var AccountSettingsFieldViews = {};

        AccountSettingsFieldViews.FieldView = Backbone.View.extend({

            className: function () {
                return "account-settings-field " + "account-settings-field-" + this.options.valueAttribute;
            },

            tagName: 'div',

            indicators: {
                'canEdit': '<i class="icon fa fa-pencil message-can-edit"></i>',
                'error': '<i class="fa fa-exclamation-triangle message-error"></i>',
                'invalidInput': '<i class="fa fa-exclamation-triangle message-invalid-input"></i>',
                'inProgress': '<i class="fa fa-spinner fa-pulse message-in-progress"></i>',
                'success': '<i class="fa fa-check message-success"></i>'
            },

            messages: {
                'canEdit': '',
                'error': gettext('An error occurred, please try again.'),
                'invalidInput': '',
                'inProgress': gettext('Saving...'),
                'success': gettext('Successfully changed.')
            },

            initialize: function (options) {

                this.template = _.template($(this.templateSelector).text());

                this.helpMessage = this.options.helpMessage || '';
                this.showMessages = _.isUndefined(this.options.showMessages) ? true : this.options.showMessages;

                _.bindAll(this, 'modelValue', 'modelValueIsSet', 'message', 'getMessage',
                          'showHelpMessage', 'showInProgressMessage', 'showSuccessMessage', 'showErrorMessage');
            },

            modelValue: function () {
                return this.model.get(this.options.valueAttribute);
            },

            modelValueIsSet: function() {
                return (this.modelValue());
            },

            message: function (message) {
                return this.$('.account-settings-field-message').html(message);
            },

            getMessage: function(message_status) {
                if ((message_status + 'Message') in this) {
                    return this[message_status + 'Message'].call(this);
                } else if (this.showMessages) {
                    return this.indicators[message_status] + this.messages[message_status];
                }
                return this.indicators[message_status];
            },

            showCanEditMessage: function(show) {
                if (!_.isUndefined(show) && show) {
                    this.message(this.getMessage('canEdit'));
                } else {
                    this.message('');
                }
            },

            showHelpMessage: function () {
                this.message(this.helpMessage);
            },

            showInProgressMessage: function () {
                this.message(this.getMessage('inProgress'));
            },

            showSuccessMessage: function () {
                var successMessage = this.getMessage('success');
                this.message(successMessage);

                if (this.options.refreshPageOnSave) {
                    document.location.reload();
                }

                var view = this;

                var context = Date.now()
                this.lastSuccessMessageContext = context;

                setTimeout(function () {
                    if ((context === view.lastSuccessMessageContext) && (view.message().html() == successMessage)) {
                        view.showHelpMessage();
                    }
                }, messageRevertDelay);
            },

            showErrorMessage: function (xhr) {
                if (xhr.status === 400) {
                    try {
                        var errors = JSON.parse(xhr.responseText);
                        var message = this.indicators['invalidInput'] + errors['field_errors'][this.options.valueAttribute]['user_message'];
                        this.message(message);
                    } catch (error) {
                        this.message(this.getMessage('error'));
                    }
                } else {
                    this.message(this.getMessage('error'));
                }
            },
        });

        AccountSettingsFieldViews.EditableFieldView = AccountSettingsFieldViews.FieldView.extend({

            initialize: function (options) {
                _.bindAll(this, 'saveAttributes', 'showDisplayMode', 'showEditMode', 'startEditing', 'finishEditing');
                this._super(options);

                this.editable = _.isUndefined(this.options.editable) ? 'always': this.options.editable;
                this.$el.addClass('editable-' + this.editable);

                if (this.editable === 'always') {
                    this.showEditMode(false);
                } else {
                    this.showDisplayMode(false);
                }
            },

            saveAttributes: function (attributes, options) {
                var view = this;
                var defaultOptions = {
                    contentType: 'application/merge-patch+json',
                    patch: true,
                    wait: true,
                    success: function (model, response, options) {
                        view.showSuccessMessage()
                    },
                    error: function (model, xhr, options) {
                        view.showErrorMessage(xhr)
                    },
                };
                this.showInProgressMessage();
                this.model.save(attributes, _.extend(defaultOptions, options));
            },

            showDisplayMode: function(render) {
                this.mode = 'display';
                if (render) { this.render(); }

                this.$el.removeClass('mode-edit');

                this.$el.toggleClass('mode-hidden', (this.editable === 'never' && !this.modelValueIsSet()));
                this.$el.toggleClass('mode-placeholder', (this.editable === 'toggle' && !this.modelValueIsSet()));
                this.$el.toggleClass('mode-display', (this.modelValueIsSet()));
            },

            showEditMode: function(render) {
                this.mode = 'edit';
                if (render) { this.render(); }

                this.$el.removeClass('mode-hidden');
                this.$el.removeClass('mode-placeholder');
                this.$el.removeClass('mode-display');

                this.$el.addClass('mode-edit');
            },

            startEditing: function (event) {
                if (this.editable === 'toggle' && this.mode !== 'edit') {
                    this.showEditMode(true);
                }
            },

            finishEditing: function(event) {
                if (this.fieldValue() !== this.modelValue()) {
                    this.saveValue();
                } else {
                    if (this.editable === 'always') {
                        this.showEditMode(true);
                    } else {
                        this.showDisplayMode(true);
                    }
                }
            },
        });

        AccountSettingsFieldViews.ReadonlyFieldView = AccountSettingsFieldViews.FieldView.extend({

            templateSelector: '#field_readonly-tpl',

            initialize: function (options) {
                this._super(options);
                _.bindAll(this, 'render', 'updateValueInField');
                this.listenTo(this.model, "change:" + this.options.valueAttribute, this.updateValueInField);
            },

            render: function () {
                this.$el.html(this.template({
                    title: this.options.title,
                    value: this.modelValue(),
                    message: this.helpMessage,
                }));
                return this;
            },

            updateValueInField: function () {
                this.$('.account-settings-field-value').html(this.modelValue());
            },
        });

        AccountSettingsFieldViews.TextFieldView = AccountSettingsFieldViews.EditableFieldView.extend({

            templateSelector: '#field_text-tpl',

            events: {
                'change input': 'saveValue',
            },

            initialize: function (options) {
                this._super(options);
                _.bindAll(this, 'render', 'fieldValue', 'updateValueInField', 'saveValue');
                this.listenTo(this.model, "change:" + this.options.valueAttribute, this.updateValueInField);
            },

            render: function () {
                this.$el.html(this.template({
                    title: this.options.title,
                    value: this.modelValue(),
                    message: this.helpMessage,
                }));
                return this;
            },

            fieldValue: function () {
                return this.$('.account-settings-field-value input').val();
            },

            updateValueInField: function () {
                this.$('.account-settings-field-value input').val(this.modelValue() || '');
            },

            saveValue: function (event) {
                var attributes = {};
                attributes[this.options.valueAttribute] = this.fieldValue();
                this.saveAttributes(attributes);

            },
        });

        AccountSettingsFieldViews.EmailFieldView = AccountSettingsFieldViews.TextFieldView.extend({

            successMessage: function() {
                return this.indicators['success'] + interpolate_text(
                    gettext('Complete you email change by clicking the confirmation link emailed to {new_email_address}.'),
                    {'new_email_address': this.fieldValue()}
                );
            },
        });

        AccountSettingsFieldViews.DropdownFieldView = AccountSettingsFieldViews.EditableFieldView.extend({

            templateSelector: '#field_dropdown-tpl',

            events: {
                'click': 'startEditing',
                'change select': 'finishEditing',
                'focusout select': 'finishEditing'
            },

            initialize: function (options) {
                _.bindAll(this, 'render', 'optionForValue', 'fieldValue', 'displayValue', 'updateValueInField', 'saveValue');
                this._super(options);

                this.listenTo(this.model, "change:" + this.options.valueAttribute, this.updateValueInField);
            },

            render: function () {
                this.$el.html(this.template({
                    mode: this.mode,
                    title: this.options.title,
                    iconName: this.options.iconName,
                    required: this.options.required,
                    selectOptions: this.options.options,
                    message: this.helpMessage
                }));

                this.updateValueInField();

                if (this.editable === 'toggle') {
                    this.showCanEditMessage(this.mode === 'display');
                }
                return this;
            },

            modelValueIsSet: function() {
                return (this.modelValue() && this.optionForValue(this.modelValue()));
            },

            optionForValue: function(value) {
                return _.find(this.options.options, function(option) { return option[0] == value; })
            },

            fieldValue: function () {
                return this.$('.account-settings-field-value select').val();
            },

            displayValue: function (value) {
                if (value) {
                    var option = this.optionForValue(value);
                    return (option ? option[1] : '');
                } else {
                    return '';
                }
            },

            updateValueInField: function () {
                if (this.mode === 'display') {
                    var displayValue = this.displayValue(this.modelValue()) || this.options.placeholderValue || '';
                    this.$('.account-settings-field-value').html(displayValue);
                    this.showDisplayMode(false);
                } else {
                    this.$('.account-settings-field-value select').val(this.modelValue() || "");
                }
            },

            saveValue: function () {
                var attributes = {};
                attributes[this.options.valueAttribute] = this.fieldValue();
                this.saveAttributes(attributes);
            },

            showEditMode: function(render) {
                this._super(render);
                this.$('.account-settings-field-value select').focus();
            },

            showSuccessMessage: function() {
                this._super();
                if (this.editable === 'toggle') {
                    this.showDisplayMode(true);
                }
            }
        });

        AccountSettingsFieldViews.AccountPrivacyFieldView = AccountSettingsFieldViews.DropdownFieldView.extend({

            render: function () {
                this._super();
                this.message();
                return this;
            },

            message: function (message) {
                if (this.profileIsPrivate) {
                    this._super(interpolate_text(
                        gettext('Your profile is set to limited because you have not set your birth year yet. Set it on the {account_settings_page_link}.'),
                        {'account_settings_page_link': '<a href="' + this.options.accountSettingsPageUrl + '">' + gettext('Account Settings page') + '</a>'}
                    ));
                } else {
                    this._super('');
                }
                return this._super();
            }
        });

        AccountSettingsFieldViews.TextareaFieldView = AccountSettingsFieldViews.EditableFieldView.extend({

            templateSelector: '#field_textarea-tpl',

            events: {
                'click .account-settings-field-wrapper': 'startEditing',
                'click .account-settings-field-placeholder': 'startEditing',
                'focusout textarea': 'finishEditing',
                'change textarea': 'adjustTextareaHeight',
                'keyup textarea': 'adjustTextareaHeight',
                'keydown textarea': 'adjustTextareaHeight',
                'paste textarea': 'adjustTextareaHeight',
                'cut textarea': 'adjustTextareaHeight'
            },

            initialize: function (options) {
                _.bindAll(this, 'render', 'adjustTextareaHeight', 'fieldValue', 'saveValue', 'updateView');
                this._super(options);
                this.listenTo(this.model, "change:" + this.options.valueAttribute, this.updateView);
            },

            render: function () {
                var value = this.modelValue();
                if (this.mode == 'display') {
                    value = value || this.options.placeholderValue;
                }
                this.$el.html(this.template({
                    mode: this.mode,
                    title: (this.modelValue() ? this.options.title : '+ ' + this.options.title),
                    value: value,
                    message: this.helpMessage,
                }));

                if (this.editable === 'toggle') {
                    this.showCanEditMessage(this.mode === 'display');
                }
                return this;
            },

            adjustTextareaHeight: function(event) {
                var textarea = this.$('textarea');
                textarea.css('height', 'auto').css('height', textarea.prop('scrollHeight') + 10);
            },

            modelValue: function() {
                var value = this._super();
                return  value ? $.trim(value) : '';
            },

            fieldValue: function () {
                return this.$('.account-settings-field-value textarea').val().trim();
            },

            saveValue: function () {
                var attributes = {};
                attributes[this.options.valueAttribute] = this.fieldValue();
                this.saveAttributes(attributes);
            },

            updateView: function () {
                if (this.mode !== 'edit') {
                    this.showDisplayMode(true);
                }
            },

            modelValueIsSet: function() {
                return !(this.modelValue() === '');
            },

            showEditMode: function(render) {
                this._super(render);
                this.adjustTextareaHeight();
                this.$('.account-settings-field-value textarea').focus();
            },

            showSuccessMessage: function() {
                this._super();
                this.showDisplayMode(true);
            }

        });

        AccountSettingsFieldViews.LinkFieldView = AccountSettingsFieldViews.FieldView.extend({

            templateSelector: '#field_link-tpl',

            events: {
                'click a': 'linkClicked',
            },

            initialize: function (options) {
                this._super(options);
                _.bindAll(this, 'render', 'linkClicked');
            },

            render: function () {
                this.$el.html(this.template({
                    title: this.options.title,
                    linkTitle: this.options.linkTitle,
                    linkHref: this.options.linkHref,
                    message: this.helpMessage,
                }));
                return this;
            },

            linkClicked: function () {
                event.preventDefault();
            },
        });

        AccountSettingsFieldViews.PasswordFieldView = AccountSettingsFieldViews.LinkFieldView.extend({

            initialize: function (options) {
                this._super(options);
                _.bindAll(this, 'resetPassword');
            },

            linkClicked: function (event) {
                event.preventDefault();
                this.resetPassword(event)
            },

            resetPassword: function (event) {
                var data = {};
                data[this.options.emailAttribute] = this.model.get(this.options.emailAttribute);

                var view = this;
                $.ajax({
                    type: 'POST',
                    url: view.options.linkHref,
                    data: data,
                    success: function (data, status, xhr) {
                        view.showSuccessMessage()
                    },
                    error: function (xhr, status, error) {
                        view.showErrorMessage(xhr);
                    }
                });
            },

            successMessage: function() {
                return this.indicators['success'] + interpolate_text(
                    gettext('Complete you password reset using the confirmation link emailed to {email_address}.'),
                    {'email_address': this.model.get(this.options.emailAttribute)}
                );
            },
        });

        return AccountSettingsFieldViews;
    })
}).call(this, define || RequireJS.define);

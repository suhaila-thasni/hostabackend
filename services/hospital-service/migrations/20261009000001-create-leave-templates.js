'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_templates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      employeeType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      templateName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reasonCategory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      templateText: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      placeholders: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      isPredefined: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isRecommended: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'file-text',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex('leave_templates', ['hospitalId']);
    await queryInterface.addIndex('leave_templates', ['employeeId']);
    await queryInterface.addIndex('leave_templates', ['isPredefined']);
    await queryInterface.addIndex('leave_templates', ['reasonCategory']);

    // Seed default predefined templates
    const defaultTemplates = [
      {
        templateName: 'Wedding / Family Function',
        reasonCategory: 'Family Event',
        templateText:
          "I am requesting leave from [start date] to [end date] to attend my [relation]'s wedding ceremony and complete the related family arrangements. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
        placeholders: JSON.stringify(['[start date]', '[end date]', "[relation's]", '[handover person]']),
        isPredefined: true,
        isRecommended: true,
        icon: 'users',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateName: 'Family Visit',
        reasonCategory: 'Family Visit',
        templateText:
          'I am requesting leave from [start date] to [end date] to visit my family members. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].',
        placeholders: JSON.stringify(['[start date]', '[end date]', '[handover person]']),
        isPredefined: true,
        isRecommended: false,
        icon: 'home',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateName: 'Religious / Cultural Event',
        reasonCategory: 'Religious / Cultural',
        templateText:
          'I am requesting leave from [start date] to [end date] to participate in a religious/cultural event. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].',
        placeholders: JSON.stringify(['[start date]', '[end date]', '[handover person]']),
        isPredefined: true,
        isRecommended: false,
        icon: 'sun',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateName: 'Travel / Vacation',
        reasonCategory: 'Travel / Vacation',
        templateText:
          'I am requesting leave from [start date] to [end date] for a planned vacation/travel. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].',
        placeholders: JSON.stringify(['[start date]', '[end date]', '[handover person]']),
        isPredefined: true,
        isRecommended: false,
        icon: 'plane',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateName: 'Medical / Health',
        reasonCategory: 'Medical / Health',
        templateText:
          'I am requesting leave from [start date] to [end date] due to medical reasons. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].',
        placeholders: JSON.stringify(['[start date]', '[end date]', '[handover person]']),
        isPredefined: true,
        isRecommended: false,
        icon: 'plus-circle',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templateName: 'Personal / Other',
        reasonCategory: 'Personal / Other',
        templateText:
          'I am requesting leave from [start date] to [end date] for personal reasons. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].',
        placeholders: JSON.stringify(['[start date]', '[end date]', '[handover person]']),
        isPredefined: true,
        isRecommended: false,
        icon: 'more-horizontal',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('leave_templates', defaultTemplates);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('leave_templates');
  },
};

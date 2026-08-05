import EmailTemplate from "../models/template.model";

export const createTemplate = async (payload: any) => {
    return await EmailTemplate.create(payload);
};

export const getTemplates = async (params: { hospitalId: number; category?: string; status?: string; limit: number; offset: number }) => {
    const where: any = { hospitalId: params.hospitalId };
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status;

    return await EmailTemplate.findAndCountAll({
        where,
        limit: params.limit,
        offset: params.offset,
        order: [["createdAt", "DESC"]],
    });
};

export const getTemplateById = async (id: number, hospitalId: number) => {
    return await EmailTemplate.findOne({
        where: { id, hospitalId }
    });
};

export const updateTemplate = async (id: number, hospitalId: number, updates: any) => {
    const template = await EmailTemplate.findOne({ where: { id, hospitalId } });
    if (!template) return null;

    await EmailTemplate.update(updates, { where: { id } });
    return await EmailTemplate.findByPk(id);
};

export const deleteTemplate = async (id: number, hospitalId: number) => {
    const deletedCount = await EmailTemplate.destroy({
        where: { id, hospitalId },
    });
    return deletedCount > 0;
};

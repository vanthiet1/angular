const ProjectModel = require('../../models/project/projectModel');
const MemberProject = require('../../models/project/memberProject');
const projectController = {
    // get all
    getAllProject: async (req, res) => {
        try {
            const allProject = await ProjectModel.find()
                .populate('teamProject', 'fullname statusWorking')
                // .populate('teamTask', 'fullname')
                .populate('tasks', 'contentTask statusTask teamTask')
            res.status(200).json(allProject);
        } catch (error) {
            res.status(500).json({ message: "lỗi server" });
        }
    },
    // get an
    getAnProject: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(403).json({ message: "không tìm thấy id dự án" })
            }
            const anProject = await ProjectModel.findById(id)
                .populate('teamProject', 'fullname statusWorking')
                .populate('tasks', 'contentTask statusTask teamTask startDateDeadline')
            res.status(200).json({ success: true, message: "success", anProject })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message })
        }
    },
    // add
    addProjectNew: async (req, res) => {
        try {
            const { nameProject, dayStart, sizeTeam, teamProject , feeProject } = req.body;
            const newProject = new ProjectModel(
                {
                    nameProject: nameProject,
                    dayStart: dayStart,
                    sizeTeam: sizeTeam,
                    feeProject: feeProject,
                    teamProject: teamProject
                }
            )
            const saveProject = await newProject.save();

            for (let userId of teamProject) {
                await MemberProject.findOneAndUpdate(
                    { employeeId: userId },
                    { $push: { employeeProjects: saveProject._id } },
                    { upsert: true, new: true }
                );
            }

            res.status(201).json({ success: true, message: 'Thêm dự án thành công', saveProject })
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },
    // edit
    updateProject: async (req, res) => {
        try {
            const { id } = req.params;
            const { nameProject, dayStart, sizeTeam, teamProject ,feeProject } = req.body;

            const updateProject = await ProjectModel.findByIdAndUpdate(
                id,
                { nameProject, dayStart: new Date(dayStart), sizeTeam, teamProject: teamProject , feeProject },
                { new: true }
            );

            if (!updateProject) {
                return res.status(404).json({ success: false, message: "Project not found" });
            }
            await MemberProject.updateMany(
                { employeeProjects: id },
                { $pull: { employeeProjects: id } }
            );

            await Promise.all(teamProject.map(async (memberId) => {
                await MemberProject.findOneAndUpdate(
                    { employeeId: memberId },
                    { $addToSet: { employeeProjects: id } },
                    { upsert: true }
                );
            }));
            res.status(200).json({ success: true, message: 'Dự án cập nhật thành công', updateProject });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    // delete
    deleteProject: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(403).json({ message: "Không tm  thấy id dự án" })
            }
            await ProjectModel.findByIdAndDelete(id)
            await MemberProject.updateMany(
                { employeeProjects: id },
                { $pull: { employeeProjects: id } }
            );
            // nếu như nhân viên chỉ có 1 dự án mà xóa thì xóa nhân viên đó ra khỏi bảng
            await MemberProject.deleteMany(
                { employeeProjects: { $size: 0 } }
            );
            res.status(200).json({ success: true, message: "Xóa thàh công" })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // cancel
    cancelProject: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(404).json({ message: "id order not found" })
            }
            const updateStatusProject = await ProjectModel.findByIdAndUpdate(
                id,
                { statusProject: false },
                { new: true }
            )
            if (!updateStatusProject) {
                return { message: "Không tìm thấy dự án" }
            }
            res.status(200).json(updateStatusProject)

        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    },
    confirmProject: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(404).json({ message: "id order not found" })
            }
            const updateStatusProject = await ProjectModel.findByIdAndUpdate(
                id,
                { statusProject: true },
                { new: true }
            )
            if (!updateStatusProject) {
                return { message: "Không tìm thấy dự án" }
            }
            res.status(200).json(updateStatusProject)

        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    },





}
module.exports = projectController;
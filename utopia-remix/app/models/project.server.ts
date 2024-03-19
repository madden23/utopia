import { prisma } from '../db.server'
import { asAccessLevel, type AccessLevel, type ProjectWithoutContent } from '../types'
import { ensure } from '../util/api.server'
import { Status } from '../util/statusCodes'

const selectProjectWithoutContent: Record<keyof ProjectWithoutContent, true> = {
  id: true,
  proj_id: true,
  owner_id: true,
  title: true,
  created_at: true,
  modified_at: true,
  deleted: true,
  ProjectAccess: true,
}

export async function listProjects(params: { ownerId: string }): Promise<ProjectWithoutContent[]> {
  return prisma.project.findMany({
    select: selectProjectWithoutContent,
    where: {
      owner_id: params.ownerId,
      OR: [{ deleted: null }, { deleted: false }],
    },
    orderBy: { modified_at: 'desc' },
  })
}

export async function getProjectOwnership(
  params: { id: string },
  config: { includeDeleted: boolean } = { includeDeleted: false },
): Promise<{ ownerId: string; accessLevel: AccessLevel } | null> {
  let whereOptions: {
    proj_id: string
    OR?: { deleted: boolean | null }[]
  } = {
    proj_id: params.id,
  }
  // if we're not including deleted projects, we need to add a condition to the query
  if (!config.includeDeleted) {
    whereOptions.OR = [{ deleted: null }, { deleted: false }]
  }
  // find the project and return the owner_id
  const project = await prisma.project.findFirst({
    select: { owner_id: true, ProjectAccess: true },
    where: whereOptions,
  })
  if (project == null || project.ProjectAccess == null) {
    return null
  }
  const accessLevel = asAccessLevel(project.ProjectAccess.access_level)
  if (accessLevel == null) {
    console.error(`invalid access level for project ${params.id}`)
    return null
  }
  return {
    ownerId: project.owner_id,
    accessLevel: accessLevel,
  }
}

export async function renameProject(params: {
  id: string
  userId: string
  title: string
}): Promise<ProjectWithoutContent> {
  return prisma.project.update({
    where: {
      proj_id: params.id,
      owner_id: params.userId,
      OR: [{ deleted: null }, { deleted: false }],
    },
    data: { title: params.title },
    select: selectProjectWithoutContent,
  })
}

export async function softDeleteProject(params: { id: string; userId: string }): Promise<void> {
  await prisma.project.update({
    where: {
      proj_id: params.id,
      owner_id: params.userId,
      OR: [{ deleted: null }, { deleted: false }],
    },
    data: { deleted: true },
  })
}

export async function restoreDeletedProject(params: { id: string; userId: string }): Promise<void> {
  await prisma.project.update({
    where: {
      proj_id: params.id,
      owner_id: params.userId,
      deleted: true,
    },
    data: { deleted: null },
  })
}

export async function listDeletedProjects(params: {
  ownerId: string
}): Promise<ProjectWithoutContent[]> {
  return await prisma.project.findMany({
    select: selectProjectWithoutContent,
    where: {
      owner_id: params.ownerId,
      deleted: true,
    },
    orderBy: { modified_at: 'desc' },
  })
}

export async function hardDeleteProject(params: { id: string; userId: string }): Promise<void> {
  await prisma.project.delete({
    where: {
      proj_id: params.id,
      owner_id: params.userId,
      deleted: true,
    },
  })
}

export async function hardDeleteAllProjects(params: { userId: string }): Promise<void> {
  await prisma.project.deleteMany({
    where: {
      owner_id: params.userId,
      deleted: true,
    },
  })
}

export async function getProjectAccessLevel(params: { projectId: string }): Promise<AccessLevel> {
  const projectAccess = await prisma.projectAccess.findUnique({
    where: { project_id: params.projectId },
    select: { access_level: true },
  })
  ensure(projectAccess != null, 'Project not found', Status.NOT_FOUND)
  const accessLevel = asAccessLevel(projectAccess.access_level)
  ensure(accessLevel != null, 'Invalid access level', Status.INTERNAL_ERROR)
  return accessLevel
}

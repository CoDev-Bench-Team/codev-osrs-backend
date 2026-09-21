import type { Type } from '@nestjs/common';
import { getMetadataStorage, type ValidationArguments } from 'class-validator';
import { ApiResponse } from '@nestjs/swagger';

const problemDetailsSchema = {
  type: 'object',
  required: ['type', 'title', 'status'],
  properties: {
    type: { type: 'string', example: 'validation-error' },
    title: { type: 'string', example: 'Validation Failed' },
    status: { type: 'integer', example: 400 },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        required: ['detail', 'pointer'],
        properties: {
          detail: { type: 'string' },
          pointer: { type: 'string', example: '#/name' },
        },
      },
    },
  },
};

type ValidationMetadataLike = {
  propertyName: string;
  constraints: any[];
  message: string | ((args: ValidationArguments) => string);
};

const formatConstraint = (constraint: unknown) => {
  if (Array.isArray(constraint)) {
    return constraint.join(', ');
  }

  return String(constraint);
};

const formatValidationMessage = (
  metadata: ValidationMetadataLike,
  bodyType: Type<unknown>,
) => {
  const args: ValidationArguments = {
    targetName: bodyType.name,
    property: metadata.propertyName,
    object: {},
    value: undefined,
    constraints: metadata.constraints,
  };

  const message =
    typeof metadata.message === 'function'
      ? metadata.message(args)
      : metadata.message;

  if (!message) {
    return `${metadata.propertyName} is invalid`;
  }

  return message
    .replace('$property', metadata.propertyName)
    .replace(/\$constraint(\d+)/g, (_match: string, index: string) =>
      formatConstraint(metadata.constraints[Number(index) - 1]),
    );
};

const createValidationErrors = (bodyType: Type<unknown>) => {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(
    bodyType,
    '',
    false,
    false,
  );

  return metadata.map((validation) => ({
    detail: formatValidationMessage(validation, bodyType),
    pointer: `#/${validation.propertyName.replace(/~/g, '~0').replace(/\//g, '~1')}`,
  }));
};

export const ApiValidationProblemResponse = (bodyType?: Type<unknown>) =>
  ApiResponse({
    status: 400,
    description: 'The request contains invalid data.',
    content: {
      'application/problem+json': {
        schema: problemDetailsSchema,
        examples: {
          validationError: {
            summary: 'Validation errors with JSON Pointers',
            value: {
              type: 'validation-error',
              title: 'Validation Failed',
              status: 400,
              errors: bodyType ? createValidationErrors(bodyType) : [],
            },
          },
        },
      },
    },
  });

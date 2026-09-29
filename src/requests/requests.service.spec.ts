import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailerService } from '../mailer/mailer.service.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { Request, RequestStatus } from './entities/request.entity.js';
import { RequestsService } from './requests.service.js';

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(Request), useValue: {} },
        { provide: MailerService, useValue: {} },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('RequestsService status emails', () => {
  it('lists each item as "Name - Model", as the design does', async () => {
    const mailer = { sendRequestApprovedEmail: vi.fn() };
    const request = {
      id: 7,
      displayId: 'REQ-7',
      status: RequestStatus.PENDING_APPROVAL,
      timeline: [],
      items: [
        {
          quantity: 1,
          asset: { name: 'Business Laptop', model: 'Dell Latitude' },
        },
      ],
      requestor: { id: 2, firstName: 'Maya', lastName: 'Santos' },
    } as unknown as Request;
    const manager = {
      findOne: vi
        .fn()
        .mockResolvedValue({ id: 7, status: RequestStatus.PENDING_APPROVAL }),
      save: vi.fn(),
    };
    const service = new RequestsService(
      {
        manager: {
          transaction: (work: (m: typeof manager) => Promise<void>) =>
            work(manager),
        },
      } as never,
      mailer as unknown as MailerService,
    );
    vi.spyOn(service, 'find').mockResolvedValue(request);

    await service.update(7, { status: RequestStatus.APPROVED }, {
      id: 1,
      role: UserRole.ADMIN,
    } as User);

    expect(mailer.sendRequestApprovedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ itemName: 'Business Laptop - Dell Latitude', quantity: 1 }],
      }),
    );
  });
});

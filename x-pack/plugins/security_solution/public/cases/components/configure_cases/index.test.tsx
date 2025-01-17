/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { ReactWrapper, mount } from 'enzyme';

import { ConfigureCases } from '.';
import { TestProviders } from '../../../common/mock';
import { Connectors } from './connectors';
import { ClosureOptions } from './closure_options';
import {
  ActionsConnectorsContextProvider,
  ConnectorAddFlyout,
  ConnectorEditFlyout,
  TriggersAndActionsUIPublicPluginStart,
} from '../../../../../triggers_actions_ui/public';
import { actionTypeRegistryMock } from '../../../../../triggers_actions_ui/public/application/action_type_registry.mock';

import { useKibana } from '../../../common/lib/kibana';
import { useConnectors } from '../../containers/configure/use_connectors';
import { useCaseConfigure } from '../../containers/configure/use_configure';
import { useActionTypes } from '../../containers/configure/use_action_types';
import { useGetUrlSearch } from '../../../common/components/navigation/use_get_url_search';

import {
  connectors,
  searchURL,
  useCaseConfigureResponse,
  useConnectorsResponse,
  useActionTypesResponse,
} from './__mock__';
import { ConnectorTypes } from '../../../../../case/common/api/connectors';

jest.mock('../../../common/lib/kibana');
jest.mock('../../containers/configure/use_connectors');
jest.mock('../../containers/configure/use_configure');
jest.mock('../../containers/configure/use_action_types');
jest.mock('../../../common/components/navigation/use_get_url_search');

const useKibanaMock = useKibana as jest.Mocked<typeof useKibana>;
const useConnectorsMock = useConnectors as jest.Mock;
const useCaseConfigureMock = useCaseConfigure as jest.Mock;
const useGetUrlSearchMock = useGetUrlSearch as jest.Mock;
const useActionTypesMock = useActionTypes as jest.Mock;

describe('ConfigureCases', () => {
  beforeEach(() => {
    useKibanaMock().services.triggersActionsUi = ({
      actionTypeRegistry: actionTypeRegistryMock.create(),
    } as unknown) as TriggersAndActionsUIPublicPluginStart;

    useActionTypesMock.mockImplementation(() => useActionTypesResponse);
  });

  describe('rendering', () => {
    let wrapper: ReactWrapper;
    beforeEach(() => {
      useCaseConfigureMock.mockImplementation(() => useCaseConfigureResponse);
      useConnectorsMock.mockImplementation(() => ({ ...useConnectorsResponse, connectors: [] }));
      useGetUrlSearchMock.mockImplementation(() => searchURL);

      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it renders the Connectors', () => {
      expect(wrapper.find('[data-test-subj="dropdown-connectors"]').exists()).toBeTruthy();
    });

    test('it renders the ClosureType', () => {
      expect(wrapper.find('[data-test-subj="closure-options-radio-group"]').exists()).toBeTruthy();
    });

    test('it renders the ActionsConnectorsContextProvider', () => {
      // Components from triggersActionsUi  do not have a data-test-subj
      expect(wrapper.find(ActionsConnectorsContextProvider).exists()).toBeTruthy();
    });

    test('it renders the ConnectorAddFlyout', () => {
      // Components from triggersActionsUi  do not have a data-test-subj
      expect(wrapper.find(ConnectorAddFlyout).exists()).toBeTruthy();
    });

    test('it does NOT render the ConnectorEditFlyout', () => {
      // Components from triggersActionsUi  do not have a data-test-subj
      expect(wrapper.find(ConnectorEditFlyout).exists()).toBeFalsy();
    });

    test('it does NOT render the EuiCallOut', () => {
      expect(
        wrapper.find('[data-test-subj="configure-cases-warning-callout"]').exists()
      ).toBeFalsy();
    });
  });

  describe('Unhappy path', () => {
    let wrapper: ReactWrapper;

    beforeEach(() => {
      useCaseConfigureMock.mockImplementation(() => ({
        ...useCaseConfigureResponse,
        closureType: 'close-by-user',
        connector: {
          id: 'not-id',
          name: 'unchanged',
          type: ConnectorTypes.none,
          fields: null,
        },
        currentConfiguration: {
          connector: {
            id: 'not-id',
            name: 'unchanged',
            type: ConnectorTypes.none,
            fields: null,
          },
          closureType: 'close-by-user',
        },
      }));
      useConnectorsMock.mockImplementation(() => ({ ...useConnectorsResponse, connectors: [] }));
      useGetUrlSearchMock.mockImplementation(() => searchURL);
      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it shows the warning callout when configuration is invalid', () => {
      expect(
        wrapper.find('[data-test-subj="configure-cases-warning-callout"]').exists()
      ).toBeTruthy();
    });

    test('it hides the update connector button when the connectorId is invalid', () => {
      expect(
        wrapper
          .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
          .exists()
      ).toBeFalsy();
    });
  });

  describe('Happy path', () => {
    let wrapper: ReactWrapper;

    beforeEach(() => {
      useCaseConfigureMock.mockImplementation(() => ({
        ...useCaseConfigureResponse,
        mapping: connectors[0].config.incidentConfiguration.mapping,
        closureType: 'close-by-user',
        connector: {
          id: 'servicenow-1',
          name: 'unchanged',
          type: ConnectorTypes.servicenow,
          fields: null,
        },
        currentConfiguration: {
          connector: {
            id: 'servicenow-1',
            name: 'unchanged',
            type: ConnectorTypes.servicenow,
            fields: null,
          },
          closureType: 'close-by-user',
        },
      }));
      useConnectorsMock.mockImplementation(() => useConnectorsResponse);
      useGetUrlSearchMock.mockImplementation(() => searchURL);

      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it renders the ConnectorEditFlyout', () => {
      expect(wrapper.find(ConnectorEditFlyout).exists()).toBeTruthy();
    });

    test('it renders with correct props', () => {
      // Connector
      expect(wrapper.find(Connectors).prop('connectors')).toEqual(connectors);
      expect(wrapper.find(Connectors).prop('disabled')).toBe(false);
      expect(wrapper.find(Connectors).prop('isLoading')).toBe(false);
      expect(wrapper.find(Connectors).prop('selectedConnector')).toBe('servicenow-1');

      // ClosureOptions
      expect(wrapper.find(ClosureOptions).prop('disabled')).toBe(false);
      expect(wrapper.find(ClosureOptions).prop('closureTypeSelected')).toBe('close-by-user');

      // Flyouts
      expect(wrapper.find(ConnectorAddFlyout).prop('addFlyoutVisible')).toBe(false);
      expect(wrapper.find(ConnectorAddFlyout).prop('actionTypes')).toEqual([
        expect.objectContaining({
          id: '.servicenow',
        }),
        expect.objectContaining({
          id: '.jira',
        }),
        expect.objectContaining({
          id: '.resilient',
        }),
      ]);

      expect(wrapper.find(ConnectorEditFlyout).prop('editFlyoutVisible')).toBe(false);
      expect(wrapper.find(ConnectorEditFlyout).prop('initialConnector')).toEqual(connectors[0]);
    });

    test('it disables correctly when the user cannot crud', () => {
      const newWrapper = mount(<ConfigureCases userCanCrud={false} />, {
        wrappingComponent: TestProviders,
      });

      expect(newWrapper.find('button[data-test-subj="dropdown-connectors"]').prop('disabled')).toBe(
        true
      );

      expect(
        newWrapper
          .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
          .prop('disabled')
      ).toBe(true);

      // Two closure options
      expect(
        newWrapper
          .find('[data-test-subj="closure-options-radio-group"] input')
          .first()
          .prop('disabled')
      ).toBe(true);

      expect(
        newWrapper
          .find('[data-test-subj="closure-options-radio-group"] input')
          .at(1)
          .prop('disabled')
      ).toBe(true);
    });
  });

  describe('loading connectors', () => {
    let wrapper: ReactWrapper;

    beforeEach(() => {
      useCaseConfigureMock.mockImplementation(() => ({
        ...useCaseConfigureResponse,
        mapping: connectors[1].config.incidentConfiguration.mapping,
        closureType: 'close-by-user',
        connector: {
          id: 'resilient-2',
          name: 'unchanged',
          type: ConnectorTypes.resilient,
          fields: null,
        },
        currentConfiguration: {
          connector: {
            id: 'servicenow-1',
            name: 'unchanged',
            type: ConnectorTypes.servicenow,
            fields: null,
          },
          closureType: 'close-by-user',
        },
      }));

      useConnectorsMock.mockImplementation(() => ({
        ...useConnectorsResponse,
        loading: true,
      }));

      useGetUrlSearchMock.mockImplementation(() => searchURL);
      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it disables correctly Connector when loading connectors', () => {
      expect(
        wrapper.find('button[data-test-subj="dropdown-connectors"]').prop('disabled')
      ).toBeTruthy();
    });

    test('it pass the correct value to isLoading attribute on Connector', () => {
      expect(wrapper.find(Connectors).prop('isLoading')).toBe(true);
    });

    test('it disables correctly ClosureOptions when loading connectors', () => {
      expect(wrapper.find(ClosureOptions).prop('disabled')).toBe(true);
    });

    test('it hides the update connector button when loading the connectors', () => {
      expect(
        wrapper
          .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
          .prop('disabled')
      ).toBe(true);
    });

    test('it shows isLoading when loading action types', () => {
      useConnectorsMock.mockImplementation(() => ({
        ...useConnectorsResponse,
        loading: false,
      }));

      useActionTypesMock.mockImplementation(() => ({ ...useActionTypesResponse, loading: true }));

      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
      expect(wrapper.find(Connectors).prop('isLoading')).toBe(true);
    });
  });

  describe('saving configuration', () => {
    let wrapper: ReactWrapper;

    beforeEach(() => {
      useCaseConfigureMock.mockImplementation(() => ({
        ...useCaseConfigureResponse,
        connector: {
          id: 'servicenow-1',
          name: 'SN',
          type: ConnectorTypes.servicenow,
          fields: null,
        },
        persistLoading: true,
      }));

      useConnectorsMock.mockImplementation(() => useConnectorsResponse);
      useGetUrlSearchMock.mockImplementation(() => searchURL);
      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it disables correctly Connector when saving configuration', () => {
      expect(wrapper.find(Connectors).prop('disabled')).toBe(true);
    });

    test('it disables correctly ClosureOptions when saving configuration', () => {
      expect(
        wrapper
          .find('[data-test-subj="closure-options-radio-group"] input')
          .first()
          .prop('disabled')
      ).toBe(true);

      expect(
        wrapper.find('[data-test-subj="closure-options-radio-group"] input').at(1).prop('disabled')
      ).toBe(true);
    });

    test('it disables the update connector button when saving the configuration', () => {
      expect(
        wrapper
          .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
          .prop('disabled')
      ).toBe(true);
    });
  });

  describe('loading configuration', () => {
    let wrapper: ReactWrapper;

    beforeEach(() => {
      useCaseConfigureMock.mockImplementation(() => ({
        ...useCaseConfigureResponse,
        loading: true,
      }));
      useConnectorsMock.mockImplementation(() => ({
        ...useConnectorsResponse,
      }));
      useGetUrlSearchMock.mockImplementation(() => searchURL);
      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it hides the update connector button when loading the configuration', () => {
      expect(
        wrapper
          .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
          .exists()
      ).toBeFalsy();
    });
  });

  describe('connectors', () => {
    let wrapper: ReactWrapper;
    let persistCaseConfigure: jest.Mock;

    beforeEach(() => {
      persistCaseConfigure = jest.fn();
      useCaseConfigureMock.mockImplementation(() => ({
        ...useCaseConfigureResponse,
        mapping: connectors[0].config.incidentConfiguration.mapping,
        closureType: 'close-by-user',
        connector: {
          id: 'resilient-2',
          name: 'My connector',
          type: ConnectorTypes.resilient,
          fields: null,
        },
        currentConfiguration: {
          connector: {
            id: 'My connector',
            name: 'My connector',
            type: ConnectorTypes.jira,
            fields: null,
          },
          closureType: 'close-by-user',
        },
        persistCaseConfigure,
      }));
      useConnectorsMock.mockImplementation(() => useConnectorsResponse);
      useGetUrlSearchMock.mockImplementation(() => searchURL);

      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    });

    test('it submits the configuration correctly when changing connector', () => {
      wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
      wrapper.update();
      wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');
      wrapper.update();

      expect(persistCaseConfigure).toHaveBeenCalled();
      expect(persistCaseConfigure).toHaveBeenCalledWith({
        connector: {
          id: 'resilient-2',
          name: 'My Connector 2',
          type: ConnectorTypes.resilient,
          fields: null,
        },
        closureType: 'close-by-user',
      });
    });

    test('the text of the update button is changed successfully', () => {
      useCaseConfigureMock
        .mockImplementationOnce(() => ({
          ...useCaseConfigureResponse,
          connector: {
            id: 'servicenow-1',
            name: 'My connector',
            type: ConnectorTypes.servicenow,
            fields: null,
          },
        }))
        .mockImplementation(() => ({
          ...useCaseConfigureResponse,
          connector: {
            id: 'resilient-2',
            name: 'My connector 2',
            type: ConnectorTypes.resilient,
            fields: null,
          },
        }));

      wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });

      wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
      wrapper.update();
      wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');
      wrapper.update();

      expect(
        wrapper
          .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
          .text()
      ).toBe('Update My Connector 2');
    });
  });
});

describe('closure options', () => {
  let wrapper: ReactWrapper;
  let persistCaseConfigure: jest.Mock;

  beforeEach(() => {
    persistCaseConfigure = jest.fn();
    useCaseConfigureMock.mockImplementation(() => ({
      ...useCaseConfigureResponse,
      mapping: connectors[0].config.incidentConfiguration.mapping,
      closureType: 'close-by-user',
      connector: {
        id: 'servicenow-1',
        name: 'My connector',
        type: ConnectorTypes.servicenow,
        fields: null,
      },
      currentConfiguration: {
        connector: {
          id: 'My connector',
          name: 'My connector',
          type: ConnectorTypes.jira,
          fields: null,
        },
        closureType: 'close-by-user',
      },
      persistCaseConfigure,
    }));
    useConnectorsMock.mockImplementation(() => useConnectorsResponse);
    useGetUrlSearchMock.mockImplementation(() => searchURL);

    wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
  });

  test('it submits the configuration correctly when changing closure type', () => {
    wrapper.find('input[id="close-by-pushing"]').simulate('change');
    wrapper.update();

    expect(persistCaseConfigure).toHaveBeenCalled();
    expect(persistCaseConfigure).toHaveBeenCalledWith({
      connector: {
        id: 'servicenow-1',
        name: 'My connector',
        type: ConnectorTypes.servicenow,
        fields: null,
      },
      closureType: 'close-by-pushing',
    });
  });
});

describe('user interactions', () => {
  beforeEach(() => {
    useCaseConfigureMock.mockImplementation(() => ({
      ...useCaseConfigureResponse,
      mapping: connectors[1].config.incidentConfiguration.mapping,
      closureType: 'close-by-user',
      connector: {
        id: 'resilient-2',
        name: 'unchanged',
        type: ConnectorTypes.resilient,
        fields: null,
      },
      currentConfiguration: {
        connector: {
          id: 'resilient-2',
          name: 'unchanged',
          type: ConnectorTypes.servicenow,
          fields: null,
        },
        closureType: 'close-by-user',
      },
    }));
    useConnectorsMock.mockImplementation(() => useConnectorsResponse);
    useGetUrlSearchMock.mockImplementation(() => searchURL);
  });

  test('it show the add flyout when pressing the add connector button', () => {
    const wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    wrapper.update();
    wrapper.find('button[data-test-subj="dropdown-connector-add-connector"]').simulate('click');
    wrapper.update();

    expect(wrapper.find(ConnectorAddFlyout).prop('addFlyoutVisible')).toBe(true);
  });

  test('it show the edit flyout when pressing the update connector button', () => {
    const wrapper = mount(<ConfigureCases userCanCrud />, { wrappingComponent: TestProviders });
    wrapper
      .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
      .simulate('click');
    wrapper.update();

    expect(wrapper.find(ConnectorEditFlyout).prop('editFlyoutVisible')).toBe(true);
    expect(
      wrapper.find('[data-test-subj="case-configure-action-bottom-bar"]').exists()
    ).toBeFalsy();
  });
});

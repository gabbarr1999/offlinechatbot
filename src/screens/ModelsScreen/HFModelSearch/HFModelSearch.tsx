import React, {useState, useCallback, useMemo, useRef, useEffect} from 'react';

import {observer} from 'mobx-react';
import debounce from 'lodash/debounce';
import {Portal, PaperProvider} from 'react-native-paper';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import {useTheme} from '../../../hooks';

import {createStyles} from './styles';
import {SearchView} from './SearchView';
import {DetailsView} from './DetailsView';

import {hfStore} from '../../../store';

import {HuggingFaceModel} from '../../../utils/types';

interface HFModelSearchProps {
  visible: boolean;
  onDismiss: () => void;
}

const DEBOUNCE_DELAY = 500;

export const HFModelSearch: React.FC<HFModelSearchProps> = observer(
  ({visible, onDismiss}) => {
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(
      null,
    );

    const searchSheetRef = useRef<BottomSheetModal>(null);
    const detailsSheetRef = useRef<BottomSheetModal>(null);

    // Clear state when closed
    useEffect(() => {
      if (!visible) {
        setSelectedModel(null);
      }
    }, [visible]);

    const debouncedSearch = useMemo(
      () =>
        debounce(async (query: string) => {
          hfStore.setSearchQuery(query);
          await hfStore.fetchModels();
        }, DEBOUNCE_DELAY),
      [], // Empty dependencies since we don't want to recreate this
    );

    // Update search query without triggering immediate search
    const handleSearchChange = useCallback(
      (query: string) => {
        debouncedSearch(query);
      },
      [debouncedSearch],
    );

    useEffect(() => {
      handleSearchChange(hfStore.searchQuery);
    }, [handleSearchChange]);

    useEffect(() => {
      if (visible) {
        searchSheetRef.current?.present();
      }
    }, [visible]);

    useEffect(() => {
      if (detailsVisible) {
        detailsSheetRef.current?.present();
      }
    }, [detailsVisible]);

    const handleModelSelect = async (model: HuggingFaceModel) => {
      setSelectedModel(model);
      setDetailsVisible(true);
      await hfStore.fetchModelData(model.id);
      const updatedModel = hfStore.getModelById(model.id);
      if (updatedModel) {
        setSelectedModel({...updatedModel});
      }
    };

    const renderBackdrop = useCallback(
      props => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    const theme = useTheme();
    const styles = createStyles(theme);

    return (
      <Portal>
        <BottomSheetModal
          ref={searchSheetRef}
          index={0}
          snapPoints={['92%']}
          enableDynamicSizing={false}
          onDismiss={onDismiss}
          enablePanDownToClose
          handleIndicatorStyle={styles.bottomSheetHandle}
          backgroundStyle={styles.bottomSheetBackground}
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backdropComponent={renderBackdrop}>
          {/*
            We need PaperProvider here because:
            1. BottomSheetModal creates a new React portal/root that's outside
               the main component tree
            2. When content is portaled, it loses access to the context (including theme)
               from the original component tree
            3. By wrapping the bottom sheet content with PaperProvider, we restore
               the theme context for all Paper components inside
          */}
          <PaperProvider theme={theme}>
            <SearchView
              testID="hf-model-search-view"
              onModelSelect={handleModelSelect}
              onChangeSearchQuery={handleSearchChange}
            />
          </PaperProvider>
        </BottomSheetModal>

        <BottomSheetModal
          ref={detailsSheetRef}
          index={0}
          snapPoints={['90%']}
          enableDynamicSizing={false}
          onDismiss={() => setDetailsVisible(false)}
          enablePanDownToClose
          stackBehavior="push"
          handleIndicatorStyle={styles.bottomSheetHandle}
          backgroundStyle={styles.bottomSheetBackground}
          backdropComponent={renderBackdrop}>
          {/* PaperProvider is needed here to restore theme context. see the comment above. */}
          <PaperProvider theme={theme}>
            <BottomSheetScrollView>
              {selectedModel && <DetailsView hfModel={selectedModel} />}
            </BottomSheetScrollView>
          </PaperProvider>
        </BottomSheetModal>
      </Portal>
    );
  },
);

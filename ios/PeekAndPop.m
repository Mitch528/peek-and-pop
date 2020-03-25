#import "PeekAndPop.h"
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>

@class RNPreviewViewController;

API_AVAILABLE(ios(13))
@interface RNPeekableWrapper : RCTView <RCTInvalidating>;

@property (nonatomic, copy) UIViewController *screenController;
@property (nonatomic, copy) RNPreviewViewController *previewController;
@property (nonatomic, copy) RCTDirectEventBlock onPop;
@property (nonatomic, copy) RCTDirectEventBlock onPeek;
@property (nonatomic, copy) RCTDirectEventBlock onAction;
@property (nonatomic, copy) RCTDirectEventBlock onDisappear;
@property (nonatomic, copy) RCTDirectEventBlock onPressPreview;
@property (nonatomic, copy) UIView *child;
@property (nonatomic, copy) NSArray *actionsForPreviewing;

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager;
- (void)onPeekEvent;

@end

API_AVAILABLE(ios(13))
@interface RNPreviewViewController : UIViewController<UIContextMenuInteractionDelegate>

- (instancetype)initWithWrapper:(RNPeekableWrapper *) wrapper;

@end

@implementation RNPreviewViewController {
    RNPeekableWrapper *_wrapper;
}


- (instancetype)initWithWrapper:(RNPeekableWrapper *) wrapper
{
    if (self = [super init]) {
        _wrapper = wrapper;
    }
    return self;
}

- (void)viewDidDisappear:(BOOL)animated {
    if (_wrapper.onDisappear) {
        _wrapper.onDisappear(nil);
    }
}

- (nullable UIContextMenuConfiguration *)contextMenuInteraction:(nonnull UIContextMenuInteraction *)interaction configurationForMenuAtLocation:(CGPoint)location {
    UIContextMenuConfiguration* config = [UIContextMenuConfiguration configurationWithIdentifier:nil previewProvider:^ UIViewController* {
        return _wrapper.previewController;
    } actionProvider:^ (NSArray<UIMenuElement*>* menuElements) {
        return [UIMenu menuWithTitle:@"" children:_wrapper.actionsForPreviewing];
    }];
    
    return config;
}

- (void)contextMenuInteraction:(UIContextMenuInteraction *)interaction willDisplayMenuForConfiguration:(UIContextMenuConfiguration *)configuration animator:(id<UIContextMenuInteractionAnimating>)animator {
    [_wrapper onPeekEvent];
}

- (void)contextMenuInteraction:(UIContextMenuInteraction *)interaction willEndForConfiguration:(UIContextMenuConfiguration *)configuration animator:(id<UIContextMenuInteractionAnimating>)animator {
    if (_wrapper.onPop) {
        _wrapper.onPop(nil);
    }
}

- (void)contextMenuInteraction:(UIContextMenuInteraction *)interaction willPerformPreviewActionForMenuWithConfiguration:(UIContextMenuConfiguration *)configuration animator:(id<UIContextMenuInteractionCommitAnimating>)animator {
    if (_wrapper.onPressPreview) {
        _wrapper.onPressPreview(nil);
    }
}

- (UITargetedPreview *)contextMenuInteraction:(UIContextMenuInteraction *)interaction previewForHighlightingMenuWithConfiguration:(UIContextMenuConfiguration *)configuration {
    UIPreviewParameters* params = [UIPreviewParameters alloc];
    
    UITargetedPreview* targetedPreview = [[UITargetedPreview alloc] initWithView:_wrapper.child parameters: params];
    
    return targetedPreview;
}

- (UITargetedPreview *)contextMenuInteraction:(UIContextMenuInteraction *)interaction previewForDismissingMenuWithConfiguration:(UIContextMenuConfiguration *)configuration {
    UIPreviewParameters* params = [UIPreviewParameters alloc];
    
    UITargetedPreview* targetedPreview = [[UITargetedPreview alloc] initWithView:_wrapper.child parameters: params];
    
    return targetedPreview;
}

@end


@implementation RNPeekableWrapper {
    RCTUIManager *_uiManager;
    UIContextMenuInteraction *_menuInteraction;
}


- (instancetype)initWithUIManager:(RCTUIManager *)uiManager
{
    if (self = [super initWithFrame:self.frame]) {
        _uiManager = uiManager;
        _previewController = [[RNPreviewViewController alloc] initWithWrapper:self];
        _menuInteraction = [[UIContextMenuInteraction alloc] initWithDelegate:_previewController];
    }
    
    return self;
}

- (void)setPreviewActions:(NSArray *)actions
{
    _actionsForPreviewing = [self translateToUIActionStyles: actions];
}

- (NSArray<UIMenuElement *> *) translateToUIActionStyles:(NSArray *)actions
{
    NSMutableArray *result = [[NSMutableArray alloc] init];
    for (NSDictionary *action in actions) {
        if ([@"group" isEqualToString:action[@"type"]]) {
            NSArray<UIMenuElement *> *innerActions = [self translateToUIActionStyles: action[@"actions"]];
            UIMenu* previewMenu = [UIMenu menuWithTitle:action[@"label"] children:innerActions];
            
            [result addObject:previewMenu];
        } else if ([@"destructive" isEqualToString:action[@"type"]]) {
            UIAction *previewAction = [UIAction actionWithTitle:action[@"label"] image:nil identifier:nil handler:^(UIAction* act) {
                _onAction(@{@"key": action[@"_key"]});
            }];
            
            [previewAction setAttributes: UIMenuElementAttributesDestructive];
            
            [result addObject:previewAction];
        } else {
            UIAction *previewAction = [UIAction actionWithTitle:action[@"label"] image:nil identifier:nil handler:^(UIAction* act) {
                _onAction(@{@"key": action[@"_key"]});
            }];
            
            [result addObject:previewAction];
        }
    }
    return result;
}

- (void)setChildRef:(NSInteger)reactTag
{
    _child = [_uiManager viewForReactTag:[NSNumber numberWithInteger: reactTag]];
    _previewController.view = super.reactSubviews[0];
}

-(void)onPeekEvent {
    if (self.onPeek) {
        _previewController.preferredContentSize = _previewController.view.bounds.size;
        self.onPeek(nil);
    }
}

- (void)layoutSubviews {
    [super layoutSubviews];
    // Called after attaching
    BOOL isRNScreen = NO;
    UIView *superScreen = self;
    while (![superScreen isKindOfClass:RCTRootView.class] && !isRNScreen) {
        superScreen  = [superScreen reactSuperview];
        NSString *name = NSStringFromClass ([superScreen class]);
        // React-native-screens changes react hierarchy and searching
        // for root view is not positive. It does not follow any
        // good programming rules but I wished not to add RNS as
        // a dependency and make it workable and without this lib
        isRNScreen = ([name isEqualToString:@"RNScreenView"]);
    }
    
    if (isRNScreen) {
        _screenController = (UIViewController *)[superScreen valueForKey: @"controller"];
        
    } else {
        _screenController = ((RCTRootView*) superScreen).reactViewController;
    }
    
    [_child addInteraction:_menuInteraction];
}


- (void)invalidate
{
    // TODO: maybe not needed. Maybe memory leak?
    // [_screenController unregisterForPreviewingWithContext:_previewController];
    [_child removeInteraction:_menuInteraction];
    _previewController.view = nil;
    _previewController = nil;
    _menuInteraction = nil;
}

@end


@implementation PeekAndPop


RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(active, BOOL)
RCT_EXPORT_VIEW_PROPERTY(childRef, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(previewActions, NSArray)
RCT_EXPORT_VIEW_PROPERTY(onPop, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPeek, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onAction, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onPressPreview, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onDisappear, RCTDirectEventBlock);

- (UIView *)view
{
    return [[RNPeekableWrapper alloc] initWithUIManager:self.bridge.uiManager];
}


@end


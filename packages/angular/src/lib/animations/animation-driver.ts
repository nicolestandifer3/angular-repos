import { AnimationPlayer } from '@angular/animations';
import { AnimationDriver } from '@angular/animations/browser';
import { ProxyViewContainer, eachDescendant, CssAnimationProperty, CSSHelper } from '@nativescript/core';

import { NativeScriptAnimationPlayer } from './animation-player';
import { Keyframe, dashCaseToCamelCase } from './utils';
import { InvisibleNode } from '../views/invisible-nodes';
import { NgView } from '../views/view-types';
import { NativeScriptDebug } from '../trace';

interface ViewMatchResult {
  found: boolean;
}

interface ViewMatchParams {
  originalView: NgView;
}

interface QueryParams {
  selector: Selector;
  multi: boolean;
}

interface QueryResult {
  matches: NgView[];
}

class Selector {
  private nsSelectors: Array<any>;
  private classSelectors: string[];

  constructor(rawSelector: string) {
    this.parse(rawSelector);
  }

  match(element: NgView): boolean {
    return this.nsSelectorMatch(element) || this.classSelectorsMatch(element);
  }

  private parse(rawSelector: string) {
    const selectors = rawSelector.split(',').map((s) => s.trim());

    this.nsSelectors = selectors.map(CSSHelper.createSelector);
    this.classSelectors = selectors.filter((s) => s.startsWith('.')).map((s) => s.substring(1));
  }

  private nsSelectorMatch(element: NgView) {
    return this.nsSelectors.some((s) => s.match(element));
  }

  private classSelectorsMatch(element: NgView) {
    return this.classSelectors.some((s) => this.hasClass(element, s));
  }

  // we're using that instead of match for classes
  // that are dynamically added by the animation engine
  // such as .ng-trigger, that's added for every :enter view
  private hasClass(element: NgView, cls: string) {
    return element && element['$$classes'] && element['$$classes'][cls];
  }
}

export class NativeScriptAnimationDriver implements AnimationDriver {
  private static validProperties = [...CssAnimationProperty._getPropertyNames(), 'transform'];

  getParentElement(element: NgView): NgView {
    return element?.parent as NgView;
  }

  validateStyleProperty(property: string): boolean {
    NativeScriptDebug.animationsLog(`CssAnimationProperty.validateStyleProperty: ${property}`);
    return NativeScriptAnimationDriver.validProperties.indexOf(property) !== -1;
  }

  matchesElement(element: NgView, rawSelector: string): boolean {
    NativeScriptDebug.animationsLog(`NativeScriptAnimationDriver.matchesElement ` + `element: ${element}, selector: ${rawSelector}`);

    const selector = this.makeSelector(rawSelector);
    return selector.match(element);
  }

  containsElement(elm1: NgView, elm2: NgView): boolean {
    NativeScriptDebug.animationsLog(`NativeScriptAnimationDriver.containsElement ` + `element1: ${elm1}, element2: ${elm2}`);

    // Checking if the parent is our fake body object
    if (elm1['isOverride']) {
      return true;
    }

    const params: ViewMatchParams = { originalView: elm2 };
    const result: ViewMatchResult = this.visitDescendants(elm1, viewMatches, params);

    return result.found;
  }

  query(element: NgView, rawSelector: string, multi: boolean): NgView[] {
    NativeScriptDebug.animationsLog(`NativeScriptAnimationDriver.query ` + `element: ${element}, selector: ${rawSelector} ` + `multi: ${multi}`);

    const selector = this.makeSelector(rawSelector);
    const params: QueryParams = { selector, multi };
    const result: QueryResult = this.visitDescendants(element, queryDescendants, params);

    return result.matches || [];
  }

  computeStyle(element: NgView, prop: string): string {
    NativeScriptDebug.animationsLog(`NativeScriptAnimationDriver.computeStyle ` + `element: ${element}, prop: ${prop}`);

    const camelCaseProp = dashCaseToCamelCase(prop);
    return element.style[camelCaseProp];
  }

  animate(element: NgView, keyframes: Keyframe[], duration: number, delay: number, easing: string): AnimationPlayer {
    NativeScriptDebug.animationsLog(`NativeScriptAnimationDriver.animate ` + `element: ${element}, keyframes: ${keyframes} ` + `duration: ${duration}, delay: ${delay} ` + `easing: ${easing}`);

    return new NativeScriptAnimationPlayer(element, keyframes, duration, delay, easing);
  }

  private makeSelector(rawSelector: string): Selector {
    return new Selector(rawSelector);
  }

  private visitDescendants(element: NgView, cb: (child: NgView, result: any, params: any) => boolean, cbParams: any): any {
    const result = {};
    // fill the result obj with the result from the callback function
    eachDescendant(element, (child: NgView) => cb(child, result, cbParams));

    return result;
  }
}

function viewMatches(element: NgView, result: ViewMatchResult, params: ViewMatchParams): boolean {
  if (element === params.originalView) {
    result.found = true;
  }

  return !result.found;
}

function queryDescendants(element: NgView, result: QueryResult, params: QueryParams): boolean {
  if (!result.matches) {
    result.matches = [];
  }

  const { selector, multi } = params;

  // skip comment and text nodes
  // because they are not actual Views
  // and cannot be animated
  if (element instanceof InvisibleNode || !selector.match(element)) {
    return true;
  }

  if (element instanceof ProxyViewContainer) {
    element.eachChild((child: NgView) => {
      result.matches.push(child);
      return true;
    });
  } else {
    result.matches.push(element);
  }

  return multi;
}

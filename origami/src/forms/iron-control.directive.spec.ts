// tslint:disable:max-classes-per-file no-access-missing-member
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormsModule, NgControl, Validators } from '@angular/forms';

import 'iron-selector/iron-selector.html';
import 'paper-checkbox/paper-checkbox.html';
import 'paper-input/paper-input.html';

import { IronControlDirective } from './iron-control.directive';

class FormComponent {
  @ViewChild(IronControlDirective) ironControl: IronControlDirective;
  @ViewChild('control') elementRef: ElementRef;
  get element(): any {
    return this.elementRef.nativeElement;
  }

  get ngControl(): NgControl {
    return (<any>this.ironControl)['ngControl']; // tslint:disable-line:no-string-literal
  }

  get control(): AbstractControl {
    if (this.ngControl.control) {
      return this.ngControl.control;
    } else {
      throw new Error('NgControl.control has not been set');
    }
  }

  model = {
    input: <string | null>'Value',
    checkbox: true,
    selector: 0,
    multiSelector: <number[]>[]
  };
}

@Component({
  selector: 'not-iron',
  template: '<div ironControl></div>'
})
class NotIronComponent { }

@Component({
  selector: 'input-component',
  template: '<paper-input #control ironControl required [(ngModel)]="model.input"></paper-input>'
})
class InputComponent extends FormComponent { }

@Component({
  selector: 'checkbox-component',
  template: '<paper-checkbox #control ironControl [(ngModel)]="model.checkbox"></paper-checkbox>'
})
class CheckboxComponent extends FormComponent { }

@Component({
  selector: 'selector-component',
  template: `
    <iron-selector #control ironControl [(ngModel)]="model.selector">
      <div>One</div>
      <div>Two</div>
    </iron-selector>
  `
})
class SelectorComponent extends FormComponent { }

@Component({
  selector: 'multi-selector-component',
  template: `
    <iron-selector #control ironControl multi [(ngModel)]="model.multiSelector">
      <div>One</div>
      <div>Two</div>
    </iron-selector>
  `
})
class MultiSelectorComponent extends FormComponent { }

@Component({
  selector: 'defer-selector-component',
  template: `
    <div #control ironControl [(ngModel)]="model.selector" [ironSelector]="selector">
      <iron-selector #selector>
        <div>One</div>
        <div>Two</div>
      </iron-selector>
    </div>
  `
})
class DeferSelectorComponent extends FormComponent { }

describe('IronControlDirective', () => {
  describe('input', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          FormsModule
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        declarations: [
          InputComponent,
          IronControlDirective,
          NotIronComponent
        ]
      });
    });

    describe('ngOnInit()', () => {
      it('should warn if element is not known iron element', done => {
        spyOn(console, 'warn');
        const notIronFixture = TestBed.createComponent(NotIronComponent);
        notIronFixture.detectChanges();
        notIronFixture.whenStable().then(() => {
          expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching('<div>'));
          done();
        }).catch(done.fail);
      });
    });

    describe('ngAfterViewInit()', () => {
      it('should update element invalid property if NgControl is dirty and invalid', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.element.invalid).toBe(false);
          fixture.componentInstance.control.markAsDirty();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.element.invalid).toBe(false);
          fixture.componentInstance.model.input = null; // tslint:disable-line:no-null-keyword
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.ngControl.invalid).toBe(true);
          expect(fixture.componentInstance.element.invalid).toBe(true);
          done();
        }).catch(done.fail);
      });

      it('should add element validate() function to NgControl validators', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          spyOn(fixture.componentInstance.element, 'validate').and.callThrough();
          fixture.componentInstance.control.updateValueAndValidity();
          expect(fixture.componentInstance.element.validate).toHaveBeenCalledTimes(1);
          done();
        }).catch(done.fail);
      });

      it('should set ironValidatable error if element validate() returns false', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          spyOn(fixture.componentInstance.element, 'validate').and.returnValue(false);
          fixture.componentInstance.control.updateValueAndValidity();
          expect(fixture.componentInstance.control.hasError('ironValidatable'))
            .toBe(true);
          done();
        }).catch(done.fail);
      });
    });

    describe('writeValue()', () => {
      it('should set value property of form element', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.element.value).toBe('Value');
          fixture.componentInstance.model.input = 'New Value';
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.element.value).toBe('New Value');
          done();
        }).catch(done.fail);
      });

      it('should not mark controls as dirty when resetting', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          fixture.componentInstance.element.value = 'New Value';
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.ngControl.dirty).toBe(true);
          fixture.componentInstance.ngControl.reset();
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.ngControl.dirty).toBe(false);
          done();
        }).catch(done.fail);
      });
    });

    describe('registerOnChange()', () => {
      it('should detect input changes', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.model.input).toBe('Value');
          fixture.componentInstance.element.value = 'New Value';
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.model.input).toBe('New Value');
          done();
        }).catch(done.fail);
      });
    });

    describe('registerOnTouched()', () => {
      it('should detect input blur', done => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.ngControl.touched).toBe(false);
          fixture.componentInstance.element.dispatchEvent(new Event('blur'));
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.ngControl.touched).toBe(true);
          done();
        }).catch(done.fail);
      });
    });

    describe('setDisabledState()', () => {
      it('should set disabled property', () => {
        const fixture = TestBed.createComponent(InputComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.ngControl.disabled).toBe(false);
          fixture.componentInstance.control.disable();
          expect(fixture.componentInstance.element.disabled).toBe(true);
          fixture.componentInstance.control.enable();
          expect(fixture.componentInstance.element.disabled).toBe(false);
        });
      });
    });
  });

  describe('checkbox', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          FormsModule
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        declarations: [
          CheckboxComponent,
          IronControlDirective
        ]
      });
    });

    describe('writeValue()', () => {
      it('should set checked property of IronCheckedElementBehavior', done => {
        const fixture = TestBed.createComponent(CheckboxComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.element.checked).toBe(true);
          fixture.componentInstance.model.checkbox = false;
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.element.checked).toBe(false);
          done();
        }).catch(done.fail);
      });
    });

    describe('registerOnChange()', () => {
      it('should detect checkbox changes', done => {
        const fixture = TestBed.createComponent(CheckboxComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.model.checkbox).toBe(true);
          fixture.componentInstance.element.checked = false;
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.model.checkbox).toBe(false);
          done();
        }).catch(done.fail);
      });
    });
  });

  describe('selector', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          FormsModule
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        declarations: [
          DeferSelectorComponent,
          IronControlDirective,
          MultiSelectorComponent,
          SelectorComponent
        ]
      });
    });

    describe('writeValue()', () => {
      it('should set selected property of IronSelectableBehavior', done => {
        const fixture = TestBed.createComponent(SelectorComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.element.selected).toBe(0);
          fixture.componentInstance.model.selector = 1;
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.element.selected).toBe(1);
          done();
        }).catch(done.fail);
      });

      it('should set selected property of deferred ironSelector', done => {
        const fixture = TestBed.createComponent(DeferSelectorComponent);
        const deferred = fixture.componentInstance.element.querySelector('iron-selector');
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(deferred.selected).toBe(0);
          fixture.componentInstance.model.selector = 1;
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(deferred.selected).toBe(1);
          done();
        }).catch(done.fail);
      });

      it('should set selectedValues property of multi IronSelectableBehavior', done => {
        const fixture = TestBed.createComponent(MultiSelectorComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.element.selectedValues).toEqual([]);
          fixture.componentInstance.model.multiSelector = [0, 1];
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.element.selectedValues).toEqual([0, 1]);
          done();
        }).catch(done.fail);
      });
    });

    describe('registerOnChange()', () => {
      it('should detect select value changes', done => {
        const fixture = TestBed.createComponent(SelectorComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.model.selector).toBe(0);
          fixture.componentInstance.element.selected = 1;
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.model.selector).toBe(1);
          done();
        }).catch(done.fail);
      });

      it('should detect deferred select value changes', done => {
        const fixture = TestBed.createComponent(DeferSelectorComponent);
        const deferred = fixture.componentInstance.element.querySelector('iron-selector');
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.model.selector).toBe(0);
          deferred.selected = 1;
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.model.selector).toBe(1);
          done();
        }).catch(done.fail);
      });

      it('should detect selected values change', done => {
        const fixture = TestBed.createComponent(MultiSelectorComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.model.multiSelector).toEqual([]);
          fixture.componentInstance.element.selectedValues = [0, 1];
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.model.multiSelector).toEqual([0, 1]);
          done();
        }).catch(done.fail);
      });
    });

    describe('registerOnTouched()', () => {
      it('should detect select iron-active events', done => {
        const fixture = TestBed.createComponent(SelectorComponent);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(fixture.componentInstance.ngControl.touched).toBe(false);
          fixture.componentInstance.element.dispatchEvent(new CustomEvent('iron-activate'));
          fixture.detectChanges();
          return fixture.whenStable();
        }).then(() => {
          expect(fixture.componentInstance.ngControl.touched).toBe(true);
          done();
        }).catch(done.fail);
      });
    });
  });
});

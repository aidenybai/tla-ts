/*---
description: Ported from TypeScript's tests/cases/compiler/typeAnnotationBestCommonTypeInArrayLiteral.ts.
outcome: success
source: tests/cases/compiler/typeAnnotationBestCommonTypeInArrayLiteral.ts
---*/
// @target: es2015
interface IMenuItem {
    id: string;
    type: string;
    link?: string;
    classes?: string;
    text?: string;
    icon?: string;
}
var menuData: IMenuItem[] = [
    {
        "id": "ourLogo",
        "type": "image",
        "link": "",
        "icon": "modules/menu/logo.svg"
    }, {
        "id": "productName",
        "type": "default",
        "link": "",
        "text": "Product Name"
    }
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/

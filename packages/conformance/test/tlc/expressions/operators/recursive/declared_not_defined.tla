(*---
description: "A RECURSIVE declaration without a definition is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE declared_not_defined ----
EXTENDS Integers
RECURSIVE F(_)
Test == TRUE
====

(*--- recorded
assume:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 11 of module declared_not_defined
    | An ASSUME may not appear within a recursive definition section.
    | line 9, col 11 to line 9, col 14 of module declared_not_defined
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
init:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 26 of module declared_not_defined
    | A VARIABLE declaration may not appear within a recursive definition section.
    | line 9, col 11 to line 9, col 14 of module declared_not_defined
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
next:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 26 of module declared_not_defined
    | A VARIABLE declaration may not appear within a recursive definition section.
    | line 9, col 11 to line 9, col 14 of module declared_not_defined
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
invariant:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 26 of module declared_not_defined
    | A VARIABLE declaration may not appear within a recursive definition section.
    | line 9, col 11 to line 9, col 14 of module declared_not_defined
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
property:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 26 of module declared_not_defined
    | A VARIABLE declaration may not appear within a recursive definition section.
    | line 9, col 11 to line 9, col 14 of module declared_not_defined
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)

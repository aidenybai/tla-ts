(*---
description: No AnySet.tla ships in the jar, so EXTENDS AnySet cannot find the module.
ref: tla2sany/StandardModules
features:
  - AnySet
flags:
  - expression
contexts:
  - assume
outcome: parse-error
---*)
---- MODULE no_shipped_module ----
EXTENDS AnySet
Test == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file no_shipped_module
    | In module no_shipped_module
    | Cannot find source file for module AnySet imported in module no_shipped_module.
    | *** Errors: 1
    | In module no_shipped_module
    | Cannot find source file for module AnySet imported in module no_shipped_module.
    3002:1 Parsing or semantic analysis failed.
---*)

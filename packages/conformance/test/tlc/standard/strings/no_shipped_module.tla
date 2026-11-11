(*---
description: "No Strings.tla ships in the jar: STRING is built in, and EXTENDS Strings cannot find the module."
ref: tla2sany/StandardModules
features:
  - Strings
flags:
  - expression
contexts:
  - assume
outcome: parse-error
---*)
---- MODULE no_shipped_module ----
EXTENDS Strings
Test == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file no_shipped_module
    | In module no_shipped_module
    | Cannot find source file for module Strings imported in module no_shipped_module.
    | *** Errors: 1
    | In module no_shipped_module
    | Cannot find source file for module Strings imported in module no_shipped_module.
    3002:1 Parsing or semantic analysis failed.
---*)

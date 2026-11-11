(*---
description: A nested module may not extend itself.
ref: tla2sany/modanalyzer/ModulePointer.java
features: [missing]
outcome: parse-error
---*)
---- MODULE nested_extends_itself ----
---- MODULE I ----
EXTENDS I
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file nested_extends_itself
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   I.tla --> I.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   I.tla --> I.tla
    3002:1 Parsing or semantic analysis failed.
---*)

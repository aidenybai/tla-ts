(*---
description: An extended file whose module differs by case is rejected.
ref: "tla2sany/modanalyzer/ParseUnit.java#verifyEquivalenceOfFileAndModuleNames"
features: [file_names]
includes: [FixCase.tla]
outcome: parse-error
---*)
---- MODULE extended_case_differs ----
EXTENDS FixCase
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file extended_case_differs
    | Unknown location
    | File name 'FixCase' does not match the name 'Fixcase' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'FixCase' does not match the name 'Fixcase' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)

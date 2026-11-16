(*---
description: "A parse error in the replacing file fails the spec, rather than falling back to the standard module."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE parse_error_in_file ----
EXTENDS Naturals
Test == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "This" at line 2, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 1, column 1.
    | Fatal errors while parsing TLA+ spec in file parse_error_in_file
    | In module Naturals
    | Could not parse module Naturals from file Naturals.tla
    | *** Errors: 1
    | In module Naturals
    | Could not parse module Naturals from file Naturals.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: "A replacing file holding a differently named module is a name mismatch, rather than falling back to the standard module."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE name_mismatch_in_file ----
EXTENDS Naturals
Test == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file name_mismatch_in_file
    | Unknown location
    | File name 'Naturals' does not match the name 'Other' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'Naturals' does not match the name 'Other' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)

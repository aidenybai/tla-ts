(*---
description: An extended file whose module has another name is rejected.
ref: "tla2sany/modanalyzer/ParseUnit.java#verifyEquivalenceOfFileAndModuleNames"
features: [file_names]
includes: [FixWrongName.tla]
outcome: parse-error
---*)
---- MODULE extended_file_mismatch ----
EXTENDS FixWrongName
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file extended_file_mismatch
    | Unknown location
    | File name 'FixWrongName' does not match the name 'OtherName' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'FixWrongName' does not match the name 'OtherName' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)

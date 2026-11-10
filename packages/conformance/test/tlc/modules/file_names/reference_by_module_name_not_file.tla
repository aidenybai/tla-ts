(*---
description: "EXTENDS looks up a file by name, so a module only known by its inside name is not found."
ref: "tla2sany/modanalyzer/ParseUnit.java#verifyEquivalenceOfFileAndModuleNames"
features: [file_names]
includes: [FixWrongName.tla]
outcome: parse-error
---*)
---- MODULE reference_by_module_name_not_file ----
EXTENDS OtherName
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file reference_by_module_name_not_file
    | In module reference_by_module_name_not_file
    | Cannot find source file for module OtherName imported in module reference_by_module_name_not_file.
    | *** Errors: 1
    | In module reference_by_module_name_not_file
    | Cannot find source file for module OtherName imported in module reference_by_module_name_not_file.
    3002:1 Parsing or semantic analysis failed.
---*)

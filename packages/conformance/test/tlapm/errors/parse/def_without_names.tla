(*---
description: DEF must be followed by at least one name, so BY DEF alone fails to parse.
ref: src/proof/p_parser.ml#usebody
mode: obligations
outcome: rejected
---*)
---- MODULE def_without_names ----
THEOREM TRUE
BY DEF
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./def_without_names.tla", line 9, character 7
    Unexpected ====

    @type: warning
    @msg: File "./def_without_names.tla", line 9, character 7

    Unexpected ====

    File "./def_without_names.tla", line 9, character 7
    Unexpected ====
    File "<unknown>":
    Error: Could not parse "./def_without_names.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

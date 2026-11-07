(*---
description: A step name cannot be cited in DEF, because DEF takes only identifiers and operators, so the module fails to parse.
ref: src/proof/p_parser.ml#definable
mode: obligations
outcome: rejected
---*)
---- MODULE def_step_name ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
<1> QED
  BY DEF <1>1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./def_step_name.tla", line 13, character 9
    Unexpected <1>1

    @type: warning
    @msg: File "./def_step_name.tla", line 13, character 9

    Unexpected <1>1

    File "./def_step_name.tla", line 13, character 9
    Unexpected <1>1
    File "<unknown>":
    Error: Could not parse "./def_step_name.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

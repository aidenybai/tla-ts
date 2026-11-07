(*---
description: A NEW declaration is not a proof step on its own, so <1> NEW z fails to parse.
ref: src/proof/p_parser.ml#step
mode: obligations
outcome: rejected
---*)
---- MODULE new_step ----
THEOREM TRUE
<1> NEW z
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./new_step.tla", line 9, character 4
    required expressions(s) missing before 'keyword NEW'

    @type: warning
    @msg: File "./new_step.tla", line 9, character 4

    required expressions(s) missing before 'keyword NEW'

    File "./new_step.tla", line 9, character 4
    required expressions(s) missing before 'keyword NEW'
    File "<unknown>":
    Error: Could not parse "./new_step.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

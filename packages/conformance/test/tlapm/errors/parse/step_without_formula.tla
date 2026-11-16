(*---
description: A numbered step needs a formula or a step keyword after its name, so <1>1. followed by a proof fails to parse.
ref: src/proof/p_parser.ml#step
mode: obligations
outcome: rejected
---*)
---- MODULE step_without_formula ----
THEOREM TRUE
<1>1. OBVIOUS
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_without_formula.tla", line 9, character 6
    required expressions(s) missing before 'keyword OBVIOUS'

    @type: warning
    @msg: File "./step_without_formula.tla", line 9, character 6

    required expressions(s) missing before 'keyword OBVIOUS'

    File "./step_without_formula.tla", line 9, character 6
    required expressions(s) missing before 'keyword OBVIOUS'
    File "<unknown>":
    Error: Could not parse "./step_without_formula.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

(*---
description: A keyword cannot name a definition, so OBVIOUS == TRUE fails to parse.
ref: src/module/m_parser.ml#modunit
mode: obligations
outcome: rejected
---*)
---- MODULE keyword_as_name ----
OBVIOUS == TRUE
THEOREM TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./keyword_as_name.tla", line 7, character 33
    Unexpected keyword OBVIOUS

    @type: warning
    @msg: File "./keyword_as_name.tla", line 7, character 33

    Unexpected keyword OBVIOUS

    File "./keyword_as_name.tla", line 7, character 33
    Unexpected keyword OBVIOUS
    File "<unknown>":
    Error: Could not parse "./keyword_as_name.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

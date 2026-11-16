(*---
description: A module without its ==== end line fails to parse.
ref: src/module/m_parser.ml#parse
mode: obligations
outcome: rejected
---*)
---- MODULE missing_module_end ----
THEOREM TRUE OBVIOUS

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./missing_module_end.tla", line 8, character 21
    Unexpected EOF

    @type: warning
    @msg: File "./missing_module_end.tla", line 8, character 21

    Unexpected EOF

    File "./missing_module_end.tla", line 8, character 21
    Unexpected EOF
    File "<unknown>":
    Error: Could not parse "./missing_module_end.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

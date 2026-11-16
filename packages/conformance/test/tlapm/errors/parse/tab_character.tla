(*---
description: tlapm rejects a TAB character anywhere in the source, since its lexer does not handle tabs.
ref: src/alexer.mll#token
mode: obligations
outcome: rejected
---*)
---- MODULE tab_character ----
THEOREM TRUE
	OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./tab_character.tla", line 9, character 1
    Unexpected TAB character. TLAPS does not handle TAB characters in source files.

    @type: warning
    @msg: File "./tab_character.tla", line 8, character 13
    Unexpected EOF

    @type: warning
    @msg: File "./tab_character.tla", line 8, character 13

    Unexpected EOF


    Unexpected TAB character. TLAPS does not handle TAB characters in source files.

    File "./tab_character.tla", line 9, character 1
    Unexpected TAB character. TLAPS does not handle TAB characters in source files.
    File "./tab_character.tla", line 8, character 13
    Unexpected EOF
    File "<unknown>":
    Error: Could not parse "./tab_character.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

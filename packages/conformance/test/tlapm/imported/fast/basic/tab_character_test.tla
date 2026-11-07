(*---
description: tlapm's own test fast/basic/tab_character_test.tla, which checks stderr Unexpected TAB character.; stderr TLAPS does not handle TAB characters in source files..
ref: test/fast/basic/tab_character_test.tla
features:
  - tlapm-test
mode: proof
outcome: rejected
---*)
---- MODULE tab_character_test ----

	(* This line contains a tab character,
in order to test that `tlapm` will exit
with a message that informs about the
presence of the tab character. *)

===================================

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./tab_character_test.tla", line 11, character 1
    Unexpected TAB character. TLAPS does not handle TAB characters in source files.

    @type: warning
    @msg: File "./tab_character_test.tla", line 9, character 36
    Unexpected EOF

    @type: warning
    @msg: File "./tab_character_test.tla", line 9, character 36

    Unexpected EOF


    Unexpected TAB character. TLAPS does not handle TAB characters in source files.

    File "./tab_character_test.tla", line 11, character 1
    Unexpected TAB character. TLAPS does not handle TAB characters in source files.
    File "./tab_character_test.tla", line 9, character 36
    Unexpected EOF
    File "<unknown>":
    Error: Could not parse "./tab_character_test.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

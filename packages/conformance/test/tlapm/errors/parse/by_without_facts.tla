(*---
description: BY must be followed by at least one fact or DEF, so a bare BY fails to parse.
ref: src/proof/p_parser.ml#usebody
mode: obligations
outcome: rejected
---*)
---- MODULE by_without_facts ----
THEOREM TRUE
BY
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./by_without_facts.tla", line 9, character 3
    Unexpected ====

    @type: warning
    @msg: File "./by_without_facts.tla", line 9, character 3

    Unexpected ====

    File "./by_without_facts.tla", line 9, character 3
    Unexpected ====
    File "<unknown>":
    Error: Could not parse "./by_without_facts.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

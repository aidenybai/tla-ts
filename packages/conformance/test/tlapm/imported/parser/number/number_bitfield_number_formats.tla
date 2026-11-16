(*---
description: The syntax corpus case "Bitfield Number Formats" in number.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/number.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE number_bitfield_number_formats ----
op1 == \b01010101
op2 == \B10101010
op3 == \o01234567
op4 == \O76543210
op5 == \h0123456789abcdef
op6 == \H9876543210FEDCBA
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./number_bitfield_number_formats.tla", line 12, character 7
    required expressions(s) missing before 'operator \'

    @type: warning
    @msg: File "./number_bitfield_number_formats.tla", line 12, character 7

    required expressions(s) missing before 'operator \'

    File "./number_bitfield_number_formats.tla", line 12, character 7
    required expressions(s) missing before 'operator \'
    File "<unknown>":
    Error: Could not parse "./number_bitfield_number_formats.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)

---- MODULE cli_post_fixture ----
EXTENDS TLC, Naturals
Pass == TLCGet("stats").distinct = 3
Fail == TLCGet("stats").distinct = 99
Broken == TLCGet("stats").distinct = "a"
WithArg(a) == a
====

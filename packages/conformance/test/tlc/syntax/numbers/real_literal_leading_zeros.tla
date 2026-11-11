(*---
description: A decimal literal may have leading zeros on both parts and TLC rejects it the same way.
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
outcome: config-error
---*)
---- MODULE real_literal_leading_zeros ----
ASSUME 001.500 = 001.500
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    001.500
---*)

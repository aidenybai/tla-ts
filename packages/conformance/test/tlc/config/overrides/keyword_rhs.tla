(*---
description: "'<-' takes the next token even if it is a keyword, which then fails as undefined."
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  CONSTANT N <- INIT
---*)
---- MODULE keyword_rhs ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for N with the undefined identifier INIT.
---*)

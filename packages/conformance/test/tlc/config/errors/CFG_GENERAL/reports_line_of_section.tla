(*---
description: The general error's line comes from where the CONSTANT section started, not where the argument list failed.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  

  CONSTANT


  F(1 2) = 3
---*)
---- MODULE reports_line_of_section ----
CONSTANT F(_)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 5002:1 TLC found an error in the configuration file at line 3
---*)

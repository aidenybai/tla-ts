(*---
description: 'A config line cannot name I!Spec: bang is not part of a config identifier, so the specification name is rejected.'
ref: tlc2/tool/impl/ModelConfig.java
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION I!InnerSpec
---*)
---- MODULE instance_name_in_config ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

---- MODULE Inner ----
EXTENDS Naturals
VARIABLE y
InnerSpec == y = 0 /\ [][y' = y]_y
====
I == INSTANCE Inner WITH y <- x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    5006:1 TLC found an error in the configuration file at line 1
    It was expecting a keyword, but did not find it.
---*)

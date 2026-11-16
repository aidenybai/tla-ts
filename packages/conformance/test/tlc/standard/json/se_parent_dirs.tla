(*---
description: Parent directories are created.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE se_parent_dirs ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("sub/dir/out.json", <<1>>) /\ JsonDeserialize("sub/dir/out.json") = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)

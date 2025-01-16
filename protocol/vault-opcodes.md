---
description: The Dexterity protocol uses a unique opcode system to manage vault operations.
---

# Vault Opcodes

Each vault operation is represented by a complete 16-byte operation code that fully specifies its behavior in terms of Clarity postconditions. This design provides a simple yet powerful way to interact with vaults while maintaining protocol security and predictability.

### Design Philosophy

The opcode system follows three core principles:

1. **Isolation**: Each operation code is entirely self-contained. There are no interactions or combinations between different opcodes, ensuring that each operation's behavior is predictable and easy to verify.
2. **Determinism**: Operations must produce consistent results between quote and execute contexts when pool state remains unchanged. This property enables reliable transaction construction and slippage protection.
3. **Single-Responsibly**: Each operation has a clearly defined purpose and behavior. The system avoids complex operation combinations in favor of explicit, single-purpose codes.

### Core Concepts

#### Operation Codes

Each opcode is a 16-byte buffer that uniquely identifies a vault operation. The protocol currently only uses only the first few bits for core operations, with the remaining unallocated and open for future protocol extensions by the community.

#### Execution Contexts

Operations can be performed in two contexts:

* **Quote**: A read-only preview of the operation's expected outcome
* **Execute**: The actual execution of the operation, which may modify vault state

#### Operation Response

All operations return a standardized delta tuple `{dx, dy, dk}` which can represent a variety of different values or information, depending on the opcode they are called with.

#### Post-Conditions

State-changing operations in Stacks require post-conditions that are derived from their quote responses. These post-conditions ensure that executed operations meet expectations and protect against adverse market movements or unexpected contract behavior.

#### State Changes

* Quote operations never modify vault state
* Execute operations make atomic state changes
* All state changes must succeed completely or revert entirely

The following sections provide a complete reference for all supported operation codes and their behaviors in both quote and execute contexts.

## Dexterity Protocol Opcode Reference

### Operation Code Table

#### Core Operations (0x00-0x0F)

<table><thead><tr><th width="114">Opcode</th><th width="287">Name</th><th width="133">Category</th><th width="112">Quote</th><th>Execute</th></tr></thead><tbody><tr><td>0x00</td><td>SWAP_A_TO_B</td><td>Swap</td><td>✓</td><td>✓</td></tr><tr><td>0x01</td><td>SWAP_B_TO_A</td><td>Swap</td><td>✓</td><td>✓</td></tr><tr><td>0x02</td><td>ADD_LIQUIDITY</td><td>Liquidity</td><td>✓</td><td>✓</td></tr><tr><td>0x03</td><td>REMOVE_LIQUIDITY</td><td>Liquidity</td><td>✓</td><td>✓</td></tr><tr><td>0x04</td><td>LOOKUP_RESERVES</td><td>Analysis</td><td>✓</td><td>✗</td></tr><tr><td>0x05</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x06</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x07</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x08</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x09</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x0A</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x0B</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x0C</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0x0D</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>...</td><td><em>...</em></td><td>-</td><td>-</td><td>-</td></tr><tr><td>0xFF^16</td><td><em>Unallocated</em></td><td>-</td><td>-</td><td>-</td></tr></tbody></table>

### Operation Specifications

#### SWAP\_A\_TO\_B (0x00)

**Category:** Swap Operations

**Execute Functionality:**

* Transfers exact input amount of token A from sender to vault
* Transfers calculated output amount of token B from vault to sender
* Updates pool reserves to reflect the swap
* Returns actual amounts transferred `{input,output,0}`

**Quote Support:**

* Calculates expected output amount for a given input
* Used implicitly by execute to determine post-conditions
* Used explicitly for UI previews and route planning
* Returns expected transfer amounts `{input,output,0}`

**Quote/Execute Relationship:**

* Quote must be called before execute to determine post-conditions
* Execute results will match quote if reserves unchanged
* Both return values map directly to required post-conditions

#### SWAP\_B\_TO\_A (0x01)

**Category:** Swap Operations

**Execute Functionality:**

* Transfers exact input amount of token B from sender to vault
* Transfers calculated output amount of token A from vault to sender
* Updates pool reserves to reflect the swap
* Returns actual amounts transferred `{output,input,0}`

**Quote Support:**

* Calculates expected output amount for a given input
* Used implicitly by execute to determine post-conditions
* Used explicitly for UI previews and route planning
* Returns expected transfer amounts `{output,input,0}`

**Quote/Execute Relationship:**

* Quote must be called before execute to determine post-conditions
* Execute results will match quote if reserves unchanged
* Both return values map directly to required post-conditions

#### ADD\_LIQUIDITY (0x02)

**Category:** Liquidity Operations

**Execute Functionality:**

* Transfers calculated amounts of both tokens from sender to vault
* Mints LP tokens to sender based on contribution
* Updates pool reserves and total supply
* Returns actual deposit and mint amounts `{depositA,depositB,mintLP}`

**Quote Support:**

* Calculates required token amounts for desired LP tokens
* Used implicitly by execute to determine deposit amounts
* Used explicitly for UI deposit previews
* Returns expected deposit amounts `{depositA,depositB,mintLP}`

**Quote/Execute Relationship:**

* Quote determines actual token amounts needed
* Execute will fail if quoted amounts unavailable
* Both return values map to three post-conditions

#### REMOVE\_LIQUIDITY (0x03)

**Category:** Liquidity Operations

**Execute Functionality:**

* Burns exact LP token amount from sender
* Transfers calculated token amounts from vault to sender
* Updates pool reserves and total supply
* Returns actual withdrawal amounts `{withdrawA,withdrawB,-burnLP}`

**Quote Support:**

* Calculates expected token returns for LP burn
* Used implicitly by execute to determine post-conditions
* Used explicitly for UI withdrawal previews
* Returns expected withdrawal amounts `{withdrawA,withdrawB,-burnLP}`

**Quote/Execute Relationship:**

* Quote determines expected token returns
* Execute results will match quote if reserves unchanged
* Both return values map directly to required post-conditions

#### LOOKUP\_RESERVES (0x04)

**Category:** Analysis Operations

**Quote Functionality:**

* Returns current pool state: `{reserveA,reserveB,totalSupply}`
* No state changes or post-conditions
* Amount parameter is ignored
* Used for analysis and UI display

**Execute Support:**

* Not supported - Quote only operation
* Will return error if attempted
* No state changes possible
* No post-conditions required

**Quote/Execute Relationship:**

* Quote-only operation
* No execute functionality
* Used to support other operations

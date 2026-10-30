---
date: 2026-10-30T02:38:11Z
draft: false
title: "SnowPro Core (COF-C03): A Condensed Learning Path"
categories:
  - technology
tags:
  - "claude-opus-5.5"
  - snowflake
  - certification
  - study guide
  - data engineering
---

This is a compact study plan for Snowflake's **SnowPro Core** certification, exam code **COF-C03**. It follows the five domains and 19 objectives in Snowflake's official **COF-C03 Exam Study Guide** (last updated 8 July 2026).[^guide] Each topic links to the Snowflake documentation page that covers it, so you study from current docs instead of old blog posts. Every number in the "must know" lists was checked against those pages in October 2026.

> **Get the official guide too.** It's free from the [certification page](https://learn.snowflake.com/en/certifications/snowpro-core-c03/) once you fill in a short form. The guide says its contents are for your own use, so this post summarises it in my own words and links to it rather than reproducing it. Use the guide's outline as your checklist, as it suggests.[^guide]

## The exam at a glance

| | |
| :- | :- |
| Exam code | COF-C03 (replaced COF-C02) |
| Format | 100 multiple-choice and multiple-select questions[^devto] |
| Time | 115 minutes[^devto][^oep] |
| Passing score | 750 out of 1000, scaled[^devto][^oep] |
| Price | US$175 per attempt[^official] |
| Recommended background | 6+ months of hands-on Snowflake and basic ANSI SQL[^guide] |
| Validity | 2 years from the issue date[^guide] |
| Timeline | COF-C03 launched 16 February 2026; the English COF-C02 retired 14 May 2026[^devto][^oep] |

The official guide doesn't give the question count, time limit or passing score. Those rows come from third-party sources. Check them on the registration page before your exam.

**Assumed knowledge:** the exam doesn't test SQL basics or cloud fundamentals directly, but some questions assume you know them. That means tables and data types, querying and changing data, views, stored procedures and functions, authentication and authorisation, and how cloud storage and compute fit together.[^guide]

**Keeping it:** you can renew the certification through Snowflake's [Continuing Education](https://learn.snowflake.com/en/snowpro-continuing-education/) program. Either complete an eligible instructor-led course or pass an equivalent or higher SnowPro exam. Your certification has to still be valid to use the program.[^guide]

## The five domains

| # | Domain | Weight |
| :- | :- | -: |
| 1 | Snowflake AI Data Cloud Features and Architecture | **31%** |
| 4 | Performance Optimization, Querying, and Transformation | 21% |
| 2 | Account Management and Data Governance | 20% |
| 3 | Data Loading, Unloading, and Connectivity | 18% |
| 5 | Data Collaboration | 10% |

These weights come from the official guide.[^guide] It notes that the domain list doesn't cover everything the exam may ask. Domain 1 is almost a third of the exam, so spend about a third of your time on it. Older study material, including some "SnowPro notes" still online, uses COF-C02's **six** domains (24/18/18/16/12/12). Don't plan your time around those numbers.

**Not tested yet:** two items in the guide are marked as untested until they're generally available everywhere. They are **Openflow** (objective 3.2) and the **default warehouse for Notebooks** (objective 1.4).[^guide]

## The learning path

The path is four phases of roughly 8 to 10 hours each. The phases are ordered so each one builds on the last: architecture first, then moving data in, then securing and paying for it, then making it fast and sharing it. The hours are my own suggestion, not Snowflake's. The guide says to set up a Snowflake University login and a [30-day free trial account](https://signup.snowflake.com/) before you start. Do every lab here in that trial.[^guide]

1. **Phase 1: The platform** (Domain 1, 31%)
2. **Phase 2: Getting data in and out** (Domain 3, plus objective 4.4 on transformation)
3. **Phase 3: Securing and paying for it** (Domain 2)
4. **Phase 4: Speed and sharing** (Domains 4 and 5, then the practice exam)

Each phase ends with the free Snowflake University courses and "[Getting Started with Snowflake](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/)" modules that the guide recommends for that domain.

---

## Phase 1: The platform (Domain 1, 31%)

**Objectives** (from the official guide[^guide]):
- **1.1:** the three architecture layers and how the editions differ.
- **1.2:** interfaces: Snowsight, the Snowflake CLI, and IDE integrations such as VS Code.
- **1.3:** the object hierarchy, from the organisation and account down to database objects such as stages, UDFs, pipes, shares, sequences, ML models and applications. Also session context and parameter precedence.
- **1.4:** configuring warehouses for different workloads.
- **1.5:** storage, table types and view types.
- **1.6:** AI/ML and app development features.

**Read:**
- [Key concepts and architecture](https://docs.snowflake.com/en/user-guide/intro-key-concepts): the three layers are **database storage**, **query processing** (virtual warehouses), and **cloud services**.
- [Snowflake editions](https://docs.snowflake.com/en/user-guide/intro-editions): learn the feature matrix. The exam likes to ask which edition a feature first appears in.
- [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/introduction/introduction), [VS Code extension](https://docs.snowflake.com/en/user-guide/vscode-ext), [account identifiers](https://docs.snowflake.com/en/user-guide/admin-account-identifier).
- [Overview of warehouses](https://docs.snowflake.com/en/user-guide/warehouses-overview), [warehouse considerations](https://docs.snowflake.com/en/user-guide/warehouses-considerations), [multi-cluster warehouses](https://docs.snowflake.com/en/user-guide/warehouses-multicluster), [Gen2 warehouses](https://docs.snowflake.com/en/user-guide/warehouses-gen2), [Snowpark-optimized warehouses](https://docs.snowflake.com/en/user-guide/warehouses-snowpark-optimized).
- [Micro-partitions and data clustering](https://docs.snowflake.com/en/user-guide/tables-clustering-micropartitions), [temporary and transient tables](https://docs.snowflake.com/en/user-guide/tables-temp-transient), [external tables](https://docs.snowflake.com/en/user-guide/tables-external-intro), [Apache Iceberg tables](https://docs.snowflake.com/en/user-guide/tables-iceberg), [dynamic tables](https://docs.snowflake.com/en/user-guide/dynamic-tables/overview), [secure views](https://docs.snowflake.com/en/user-guide/views-secure).
- [Parameters](https://docs.snowflake.com/en/sql-reference/parameters): account, session and object parameters, and how a lower level overrides a higher one.
- [Cortex AI Functions](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql), [Cortex Search](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/cortex-search-overview), [Cortex Analyst](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst), [Snowflake ML](https://docs.snowflake.com/en/developer-guide/snowflake-ml/overview), [Streamlit in Snowflake](https://docs.snowflake.com/en/developer-guide/streamlit/about-streamlit), [Snowflake Notebooks](https://docs.snowflake.com/en/user-guide/ui-snowsight/notebooks).

**Must know:**
- **Which edition each feature needs.** Standard Edition includes 1-day Time Travel, Fail-safe, dynamic tables, Iceberg tables, and database replication. **Enterprise** adds Time Travel of up to 90 days, multi-cluster warehouses, materialized views, search optimization, query acceleration, masking and row access policies. **Business Critical** adds Tri-Secret Secure, private connectivity (PrivateLink), HIPAA/HITRUST support, and account **failover/failback**.[^editions]
- **Billing:** warehouses bill per second, with a 60-second minimum each time they start. Auto-suspend is on by default.[^wh]
- **Scale up or scale out?** Making a warehouse bigger ("scaling up") helps large, complex queries. It isn't meant for concurrency. For many users at once, scale out with a multi-cluster warehouse (Enterprise) or add separate warehouses. Running queries of similar complexity on the same warehouse gives the best results.[^whc]
- **Multi-cluster warehouses** run in *maximized* mode (minimum clusters = maximum) or *auto-scale* mode (maximum > minimum). The **Standard** scaling policy (the default) starts clusters to avoid queuing. **Economy** keeps the running clusters fully loaded and accepts some queuing to save credits.[^mcw]
- **Gen2** is the next generation of standard warehouses. New standard warehouses default to `GENERATION = '2'` where it's available, but Gen2 doesn't come in 5X-Large or 6X-Large. **Snowpark-optimized** warehouses give you more memory on a single node, for jobs like ML training.[^gen2][^spo]
- **Account identifiers:** the preferred form is `orgname-accountname`.[^acctid]
- **Micro-partitions** hold 50 to 500 MB of *uncompressed* data each, stored by column. They're created automatically, and they're what lets Snowflake skip data a query doesn't need (pruning).[^mp]
- **Table types:** temporary tables last for the session. Temporary and transient tables get 0 or 1 day of Time Travel and **no Fail-safe**. Permanent tables get 7 days of Fail-safe. **External tables** query files in an external stage as if they were a table. **Iceberg tables** store Parquet files in an *external volume* you manage, and use either Snowflake or an external catalog.[^tt][^ext][^ice]
- **Secure views** exist because a normal view's internal optimisations can indirectly expose data in the base tables.[^sv]
- **The Cortex family:**
  - **AI functions** run in SQL, such as `AI_COMPLETE`, `AI_CLASSIFY`, `AI_FILTER`, `AI_AGG` and `AI_EXTRACT`.[^cortex]
  - **Cortex Search** is hybrid (vector and keyword) "fuzzy" search, often used for RAG.[^csearch]
  - **Cortex Analyst** answers business users' natural-language questions about structured data, through a REST API.[^canalyst]
  - **Snowflake ML** covers the Feature Store and Model Registry.[^ml]

**Recent changes:** the original Notebooks are now called **Legacy Notebooks**. Their replacement is **Notebooks in Workspaces**, which is compatible with Jupyter.[^nb] There's also a newer **Adaptive Compute** option (Enterprise Edition and up, in some regions) that sizes and routes compute automatically.[^adaptive] Adaptive Compute isn't in the guide's warehouse objectives, so spend your time on standard warehouses.[^guide]

**Lab:** in a trial account, create an X-Small warehouse and change its size. Turn it into a multi-cluster warehouse with each scaling policy. Create a permanent, a transient and a temporary table, then run `SHOW TABLES` and compare the `retention_time` column.

**Official resources:**[^guide]
- [Data Warehousing Workshop (Badge 1)](https://learn.snowflake.com/en/courses/OD-ESS-DWW/)
- Level Up: [Key Concepts and Architecture](https://learn.snowflake.com/en/courses/OD-LVLUP-102/), [Snowflake Ecosystem](https://learn.snowflake.com/en/courses/OD-LVLUP-103/), [Object Hierarchy](https://learn.snowflake.com/en/courses/OD-LVLUP-105/), [Accounts and Assurances](https://learn.snowflake.com/en/courses/OD-LVLUP-104/)
- Getting Started modules 1–2: [the lab environment and the user interface](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/#prepare-your-lab-environment)

---

## Phase 2: Getting data in and out (Domain 3, 18%, plus 4.4)

**Objectives** (from the official guide[^guide]):
- **3.1:** file formats, internal and external stages, server-side encryption, directory tables, `COPY INTO` and its error-handling options.
- **3.2:** automated ingestion with Snowpipe, Snowpipe Streaming, streams, tasks and dynamic tables.
- **3.3:** drivers, connectors, and storage, API and Git integrations.
- **4.4:** transforming structured, semi-structured and unstructured data, including aggregate and window functions.

**Read:**
- [Overview of data loading](https://docs.snowflake.com/en/user-guide/data-load-overview), [preparing your data files](https://docs.snowflake.com/en/user-guide/data-load-considerations-prepare), [loading considerations](https://docs.snowflake.com/en/user-guide/data-load-considerations-load), [`COPY INTO <table>`](https://docs.snowflake.com/en/sql-reference/sql/copy-into-table), [unloading](https://docs.snowflake.com/en/user-guide/data-unload-overview), [directory tables](https://docs.snowflake.com/en/user-guide/data-load-dirtables).
- [Snowpipe](https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro), [streams](https://docs.snowflake.com/en/user-guide/streams-intro), [tasks](https://docs.snowflake.com/en/user-guide/tasks-intro), [dynamic tables](https://docs.snowflake.com/en/user-guide/dynamic-tables/overview).
- [Drivers](https://docs.snowflake.com/en/developer-guide/drivers), [storage integrations](https://docs.snowflake.com/en/user-guide/data-load-s3-config-storage-integration), [API integrations](https://docs.snowflake.com/en/sql-reference/sql/create-api-integration), [Git repositories in Snowflake](https://docs.snowflake.com/en/developer-guide/git/git-overview).
- [Querying semi-structured data](https://docs.snowflake.com/en/user-guide/querying-semistructured), [FLATTEN](https://docs.snowflake.com/en/sql-reference/functions/flatten), [unstructured data](https://docs.snowflake.com/en/user-guide/unstructured-intro), [window functions](https://docs.snowflake.com/en/user-guide/functions-window-using).

**Must know:**
- **Stages:** each user has a **user stage** and each table has a **table stage**, and neither can be altered or dropped. A table stage only loads into its own table. **Named** internal and external stages are schema objects with their own privileges. `PUT` uploads files to an internal stage, and `GET` downloads unloaded files from one.[^load][^unload]
- **Directory tables** sit on top of a stage and store file-level metadata about its files. They aren't separate objects and have no privileges of their own.[^dir]
- **File sizing:** aim for files of about **100 to 250 MB compressed**. How many files load in parallel depends on the warehouse size.[^prep]
- **Load metadata:** `COPY INTO` remembers which files it has loaded for **64 days**, so it won't load the same file twice. `FORCE = TRUE` reloads everything regardless, which can duplicate data. A Snowpipe pipe remembers for **14 days**, and truncating the target table doesn't reset that.[^loadc][^copy][^pipe]
- **Error handling:** `ON_ERROR` defaults to `ABORT_STATEMENT` for bulk `COPY` and `SKIP_FILE` for Snowpipe. `SKIP_FILE` is slower because it buffers whole files. `PURGE = TRUE` removes files from the stage after they load successfully.[^copy]
- **Unloading:** `COPY INTO <location>` writes multiple files by default (`SINGLE = FALSE`).[^unload]
- **Snowpipe** is a pipe (one `COPY INTO` statement) that runs on serverless compute. It's triggered by cloud event notifications (`AUTO_INGEST = TRUE`) or the REST API. **Snowpipe Streaming** loads rows rather than files.[^pipe]
- **Streams** store an *offset* and no table data. Know the three types: standard, append-only and insert-only.[^streams]
- **Tasks** run on a schedule or when an event happens, on serverless or user-managed compute. You can chain them into **task graphs**.[^tasks]
- **Dynamic tables** are declarative: you write a `SELECT` and a `TARGET_LAG`, and Snowflake refreshes the table, incrementally or in full, in dependency order.[^dt]
- **Integrations:**
  - A **storage integration** lets a stage reach cloud storage without passing credentials around.[^si]
  - An **API integration** stores the details of an HTTPS service.[^api]
  - A **Git integration** syncs a remote repository into a clone inside Snowflake, including all its branches, tags and commits.[^git]
- **Unstructured files** are reached through scoped URLs, file URLs or pre-signed URLs.[^unstr]

**Lab:** stage a JSON file, load it into a `VARIANT` column, flatten it with `LATERAL FLATTEN`, and then rebuild the same pipeline as a dynamic table. Load a file twice to see the load metadata skip it, then reload it with `FORCE = TRUE`.

**Official resources:**[^guide]
- [Level Up: Data Loading](https://learn.snowflake.com/en/courses/OD-LVLUP-106/)
- Getting Started modules 4–5: loading [CSVs](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/#loading-structured-data-into-snowflake-csvs) and [JSON](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/#loading-semi-structured-data-into-snowflake-jsons)
- [Best Practices for Data Unloading](https://community.snowflake.com/s/article/Best-Practices-for-Data-Unloading) (Snowflake Community)

---

## Phase 3: Securing and paying for it (Domain 2, 20%)

**Objectives** (from the official guide[^guide]):
- **2.1:** the security model: RBAC and DAC, the securable object hierarchy, network policies, authentication methods (MFA, federated SSO, OAuth and key pairs), and system, account, database, custom and secondary roles. Also account identifiers, logging and tracing.
- **2.2:** governance: masking and row-level security, tagging, privacy policies, the Trust Center, encryption keys, alerts and notifications, replication and failover, and lineage.
- **2.3:** monitoring and cost: resource monitors, warehouse credit usage, and the `ACCOUNT_USAGE` schema.

**Read:**
- [Access control overview](https://docs.snowflake.com/en/user-guide/security-access-control-overview), [configuring access control](https://docs.snowflake.com/en/user-guide/security-access-control-configure), [secondary roles](https://docs.snowflake.com/en/sql-reference/sql/use-secondary-roles), [caller's and owner's rights](https://docs.snowflake.com/en/developer-guide/stored-procedure/stored-procedures-rights).
- [MFA](https://docs.snowflake.com/en/user-guide/security-mfa), [federated authentication and SSO](https://docs.snowflake.com/en/user-guide/admin-security-fed-auth-overview), [OAuth](https://docs.snowflake.com/en/user-guide/oauth-intro), [key-pair authentication](https://docs.snowflake.com/en/user-guide/key-pair-auth), [network policies](https://docs.snowflake.com/en/user-guide/network-policies).
- [Dynamic Data Masking](https://docs.snowflake.com/en/user-guide/security-column-ddm-intro), [row access policies](https://docs.snowflake.com/en/user-guide/security-row-intro), [aggregation](https://docs.snowflake.com/en/user-guide/aggregation-policies) and [projection](https://docs.snowflake.com/en/user-guide/projection-policies) policies, [object tagging](https://docs.snowflake.com/en/user-guide/object-tagging/introduction), [Trust Center](https://docs.snowflake.com/en/user-guide/trust-center/overview), [encryption key management](https://docs.snowflake.com/en/user-guide/security-encryption-manage), [alerts](https://docs.snowflake.com/en/user-guide/alerts), [data lineage](https://docs.snowflake.com/en/user-guide/ui-snowsight-lineage), [logging and tracing](https://docs.snowflake.com/en/developer-guide/logging-tracing/logging-tracing-overview).
- [Resource monitors](https://docs.snowflake.com/en/user-guide/resource-monitors), [Account Usage](https://docs.snowflake.com/en/sql-reference/account-usage).

**Must know:**
- **Access control models:** in **DAC**, every object has an owner, who can grant access to it. In **RBAC**, privileges go to roles and roles go to users. **UBAC** grants privileges to users directly.[^ac]
- **System roles:** ACCOUNTADMIN includes SYSADMIN and SECURITYADMIN. SECURITYADMIN inherits USERADMIN and has MANAGE GRANTS. **ORGADMIN is being phased out** in favour of **GLOBALORGADMIN**, which older material won't mention.[^ac]
- **Secondary roles:** objects are created with the *primary* role's privileges, but secondary roles add their privileges to other statements.[^sec]
- **Stored procedures run with owner's rights by default.** Declare `EXECUTE AS CALLER` if the procedure should use the caller's own privileges instead.[^rights]
- **Authentication:**
  - **MFA** is for human users who sign in with a password. Snowflake is moving to require MFA for all password sign-ins.[^mfa]
  - **Service users** authenticate another way, such as a **key pair**, which needs at least a 2048-bit RSA key.[^mfa][^kp]
  - **Federated SSO** works through SAML 2.0 or OpenID Connect identity providers.[^fed]
  - **OAuth** comes in two kinds: Snowflake OAuth and External OAuth.[^oauth]
- **Governance policies** are all schema-level objects:
  - **Masking policies** mask column values at query time.[^ddm]
  - **Row access policies** decide which rows a query returns.[^rap]
  - **Aggregation policies** make queries aggregate rows into groups of a minimum size.[^agg]
  - **Projection policies** decide whether a column can appear in query output.[^proj]

  Masking, row access, aggregation and projection policies all need Enterprise Edition.[^editions]
- **Tags** are key-value pairs. Child objects inherit them, and they can be set to propagate automatically.[^tags] **Lineage** shows where an object's data comes from and where it goes, and needs Enterprise Edition.[^lineage]
- **Encryption:** all data is encrypted by default with AES, using a hierarchical key model. Snowflake rotates the keys automatically, and Enterprise adds periodic rekeying.[^enc][^editions]
- **Trust Center** checks an account against *scanners* and reports *findings*.[^trust] An **alert** is a schema-level object that checks a condition on a schedule and runs an action when it's met.[^alerts]
- **Resource monitors** only cover warehouses, not serverless features. Only **ACCOUNTADMIN** can create one. A monitor's credit quota counts cloud services usage too.[^rm]
- **ACCOUNT_USAGE vs INFORMATION_SCHEMA:** ACCOUNT_USAGE includes dropped objects, lags by **45 minutes to 3 hours**, and keeps data for **1 year**. INFORMATION_SCHEMA has no lag, but only keeps **7 days to 6 months**.[^au]

**Lab:** build a small role hierarchy under SYSADMIN, then add a masking policy that shows full email addresses to one role only. Write one owner's-rights and one caller's-rights procedure and compare what a low-privilege role can do with each. Set a resource monitor on your warehouse with a low quota and watch it trigger.

**Official resources:**[^guide]
- Courses: [Level Up: Resource Monitors](https://learn.snowflake.com/en/courses/OD-LVLUP-107/), [FinOps for Snowflake](https://learn.snowflake.com/en/courses/OD-FINOPS/)
- Getting Started module 9: [roles, account admin and Account Usage](https://quickstarts.snowflake.com/guide/getting_started_with_snowflake/index.html#8)
- Reading: [Quickly Visualize Snowflake's Roles, Grants and Privileges](https://community.snowflake.com/s/article/Quickly-Visualize-Snowflake-s-Roles-Grants-and-Privileges), [Definitive Guide to Managing Spend in Snowflake](https://www.snowflake.com/en/resources/white-paper/definitive-guide-to-managing-spend-in-snowflake/)

---

## Phase 4: Speed and sharing (Domains 4 and 5, 31% together)

**Objectives** (from the official guide[^guide]):
- **4.1:** evaluating query performance with Query Profile and query insights. Look for spilling, inefficient pruning, exploding joins and queuing. Use the `ACCOUNT_USAGE` views for query history and cost attribution, and group similar workloads together.
- **4.2:** query acceleration, search optimization, clustering keys and materialized views.
- **4.3:** the result, metadata and warehouse caches.
- **5.1:** replication and failover, secure sharing, cloning, Time Travel and Fail-safe.
- **5.2:** provider, consumer and reader accounts, direct shares, resharing and clean rooms.
- **5.3:** Marketplace, private and public listings, and Native Apps.

**Read:**
- [Query Profile in Snowsight](https://docs.snowflake.com/en/user-guide/ui-snowsight-activity), [query insights](https://docs.snowflake.com/en/user-guide/query-insights), [QUERY_ATTRIBUTION_HISTORY](https://docs.snowflake.com/en/sql-reference/account-usage/query_attribution_history).
- [Query Acceleration Service](https://docs.snowflake.com/en/user-guide/query-acceleration-service), [search optimization](https://docs.snowflake.com/en/user-guide/search-optimization-service), [clustering keys](https://docs.snowflake.com/en/user-guide/tables-clustering-keys), [materialized views](https://docs.snowflake.com/en/user-guide/views-materialized), [persisted query results](https://docs.snowflake.com/en/user-guide/querying-persisted-results).
- [Time Travel](https://docs.snowflake.com/en/user-guide/data-time-travel), [Fail-safe](https://docs.snowflake.com/en/user-guide/data-failsafe), [cloning](https://docs.snowflake.com/en/user-guide/object-clone), [TRUNCATE TABLE](https://docs.snowflake.com/en/sql-reference/sql/truncate-table), [replication and failover](https://docs.snowflake.com/en/user-guide/account-replication-intro).
- [Secure Data Sharing](https://docs.snowflake.com/en/user-guide/data-sharing-intro), [reader accounts](https://docs.snowflake.com/en/user-guide/data-sharing-reader-create), [listings](https://docs.snowflake.com/en/collaboration/collaboration-listings-about), [Snowflake Marketplace](https://docs.snowflake.com/en/collaboration/collaboration-marketplace-about), [Native App Framework](https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about), [Data Clean Rooms](https://docs.snowflake.com/en/user-guide/cleanrooms/introduction).

**Must know (performance):**
- **Query Profile signs to recognise:**
  - Bytes spilled to *local* or *remote* storage: the warehouse ran out of memory, so try a bigger size.
  - Poor pruning: compare partitions scanned with the total.
  - The most expensive nodes in the plan.[^qp]

  **Query insights** flags exploding joins, joins without a condition, filters that can't prune, remote spilling, and queries that waited too long in a warehouse's queue.[^qi] `QUERY_ATTRIBUTION_HISTORY` shows the warehouse compute cost of individual queries.[^qah]
- **Which tool for which problem:**
  - **QAS** offloads the heavy parts of *outlier* queries to shared serverless compute.[^qas]
  - **Search optimization** speeds up *selective point lookups*.[^sos]
  - **Clustering keys** are for *very large* tables where the natural data order is poor.[^ck]
  - **Materialized views** query a **single table** only and are kept up to date in the background.[^mv]
- **Caches:** the **result cache** keeps a query's result for 24 hours, and each reuse resets the clock, up to **31 days** in total. A reuse only happens if the underlying data hasn't changed and the role has access.[^rc] The other two caches to know are the *metadata* cache and the *warehouse* (local disk) cache.[^guide]

**Must know (protection and sharing):**
- **Time Travel** keeps 1 day by default. Permanent objects can be set to anything from 0 to 90 days, but values above 1 day need Enterprise Edition. After Time Travel comes **Fail-safe**: 7 days that you can't configure, where only **Snowflake Support** can recover data.[^ttp][^fs]
- **Cloning** copies the structure but not the data.
  - A cloned database or schema keeps the grants on its child objects, but not the grants on the container itself.
  - Internal named stages are only cloned with `INCLUDE INTERNAL STAGES`.
  - **Unconsumed records in a cloned stream are inaccessible**, much as a cloned table's history starts when the clone is made.[^clone]
- **`TRUNCATE` vs `DELETE`:** both keep the deleted data for Time Travel. `TRUNCATE` also clears the table's load metadata, so the same files can be loaded again.[^trunc]
- **Replication:** replication groups produce read-only secondaries. **Failover groups** can be promoted to primary, and failover needs **Business Critical**.[^repl]
- **Sharing:** shared objects are **read-only** and no data is copied. Consumers only pay for the compute they use. A **reader account** is created and paid for by the provider, for consumers who don't have a Snowflake account.[^share][^reader]

**Lab:** run the same query twice and watch the second run come back from the result cache. Drop a table and `UNDROP` it. Clone a schema that contains a stream, and check which grants came with it and what the cloned stream returns. Share a secure view with a reader account.

**Official resources:**[^guide]
- Courses: [Data Application Builders Workshop (Badge 3)](https://learn.snowflake.com/en/courses/uni-ess-dabw/), [Level Up: Query History and Caching](https://learn.snowflake.com/en/courses/OD-LVLUP-201/), [Level Up: Context in Snowflake](https://learn.snowflake.com/en/courses/OD-LVLUP-202/), [Collaboration, Marketplace & Cost Estimation Workshop (Badge 2)](https://learn.snowflake.com/en/courses/OD-ESS-CMCW/), [Level Up: Native App Development for Beginners](https://learn.snowflake.com/en/courses/OD-LVLUP-308/)
- Getting Started modules: [7 (caching and cloning)](https://quickstarts.snowflake.com/guide/getting_started_with_snowflake/index.html#5), [6 (Marketplace data)](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/#getting-data-from-snowflake-marketplace), [8 (Time Travel)](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/#using-time-travel), [10 (sharing via Marketplace)](https://www.snowflake.com/en/developers/guides/getting-started-with-snowflake/#sharing-data-securely-via-snowflake-marketplace)
- Reading: [Understanding Result Caching](https://community.snowflake.com/s/article/Understanding-Result-Caching), [Local and Remote Disk Spilling](https://community.snowflake.com/s/article/Performance-impact-from-local-and-remote-disk-spilling), [Search Optimization: When & How to Use](https://community.snowflake.com/s/article/Search-Optimization-When-How-To-Use)

---

## Before you book

The official guide recommends four habits:[^guide]

1. **Set a date** and plan backwards from it.
2. **Weight your time** by the domain percentages.
3. **Use the outline as a checklist** of what you know and what you don't.
4. **Take the official [practice exam](https://learn.snowflake.com/en/certifications/snowpro-practice-exams/)** to get used to the question style.

If you'd rather have an instructor, the guide suggests two routes. One is *Snowflake Fundamentals* followed by the *SnowPro Core On-Demand Preparation Course*. The other is *Snowflake Foundations*, then *Administering Snowflake*, then the same preparation course.[^guide]

The guide's sample questions are scenarios: a requirement changes, and you pick the right setting or command. You can't answer those from memorised definitions alone, which is why every phase above has a lab. Stay away from "exam dump" sites. They aren't official, and they're often written for the old exam anyway.

## References

Most links below go to Snowflake's documentation, study guide and certification pages. Entries marked *(Unofficial)* are third-party sources, used only for exam details the official guide doesn't state.

[^guide]: Snowflake, "SnowPro Core COF-C03 Exam Study Guide," last updated 8 July 2026. Free from the certification page after a short form. <https://learn.snowflake.com/en/certifications/snowpro-core-c03/>
[^official]: Snowflake, "SnowPro Core Certification (COF-C03)," *Snowflake University*. <https://learn.snowflake.com/en/certifications/snowpro-core-c03/>
[^editions]: Snowflake Docs, "Snowflake editions." <https://docs.snowflake.com/en/user-guide/intro-editions>
[^wh]: Snowflake Docs, "Overview of warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-overview>
[^whc]: Snowflake Docs, "Warehouse considerations." <https://docs.snowflake.com/en/user-guide/warehouses-considerations>
[^mcw]: Snowflake Docs, "Multi-cluster warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-multicluster>
[^gen2]: Snowflake Docs, "Snowflake generation 2 standard warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-gen2>
[^spo]: Snowflake Docs, "Snowpark-optimized warehouses." <https://docs.snowflake.com/en/user-guide/warehouses-snowpark-optimized>
[^acctid]: Snowflake Docs, "Account identifiers." <https://docs.snowflake.com/en/user-guide/admin-account-identifier>
[^adaptive]: Snowflake Docs, "Adaptive Compute." <https://docs.snowflake.com/en/user-guide/warehouses-adaptive>
[^mp]: Snowflake Docs, "Micro-partitions & Data Clustering." <https://docs.snowflake.com/en/user-guide/tables-clustering-micropartitions>
[^tt]: Snowflake Docs, "Working with Temporary and Transient Tables." <https://docs.snowflake.com/en/user-guide/tables-temp-transient>
[^ext]: Snowflake Docs, "Introduction to external tables." <https://docs.snowflake.com/en/user-guide/tables-external-intro>
[^ice]: Snowflake Docs, "Apache Iceberg tables." <https://docs.snowflake.com/en/user-guide/tables-iceberg>
[^sv]: Snowflake Docs, "Working with Secure Views." <https://docs.snowflake.com/en/user-guide/views-secure>
[^cortex]: Snowflake Docs, "Snowflake Cortex AI Functions." <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql>
[^csearch]: Snowflake Docs, "Cortex Search." <https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/cortex-search-overview>
[^canalyst]: Snowflake Docs, "Cortex Analyst." <https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst>
[^ml]: Snowflake Docs, "Snowflake ML." <https://docs.snowflake.com/en/developer-guide/snowflake-ml/overview>
[^nb]: Snowflake Docs, "About Legacy Snowflake Notebooks." <https://docs.snowflake.com/en/user-guide/ui-snowsight/notebooks>
[^load]: Snowflake Docs, "Overview of data loading." <https://docs.snowflake.com/en/user-guide/data-load-overview>
[^dir]: Snowflake Docs, "Directory tables." <https://docs.snowflake.com/en/user-guide/data-load-dirtables>
[^prep]: Snowflake Docs, "Preparing your data files." <https://docs.snowflake.com/en/user-guide/data-load-considerations-prepare>
[^loadc]: Snowflake Docs, "Loading considerations: load metadata." <https://docs.snowflake.com/en/user-guide/data-load-considerations-load>
[^copy]: Snowflake Docs, "COPY INTO &lt;table&gt;." <https://docs.snowflake.com/en/sql-reference/sql/copy-into-table>
[^unload]: Snowflake Docs, "Overview of data unloading." <https://docs.snowflake.com/en/user-guide/data-unload-overview>
[^pipe]: Snowflake Docs, "Snowpipe." <https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro>
[^streams]: Snowflake Docs, "Introduction to streams." <https://docs.snowflake.com/en/user-guide/streams-intro>
[^tasks]: Snowflake Docs, "Introduction to tasks." <https://docs.snowflake.com/en/user-guide/tasks-intro>
[^dt]: Snowflake Docs, "Dynamic tables." <https://docs.snowflake.com/en/user-guide/dynamic-tables/overview>
[^si]: Snowflake Docs, "Configure a Snowflake storage integration to access Amazon S3." <https://docs.snowflake.com/en/user-guide/data-load-s3-config-storage-integration>
[^api]: Snowflake Docs, "CREATE API INTEGRATION." <https://docs.snowflake.com/en/sql-reference/sql/create-api-integration>
[^git]: Snowflake Docs, "Using a Git repository in Snowflake." <https://docs.snowflake.com/en/developer-guide/git/git-overview>
[^unstr]: Snowflake Docs, "Introduction to unstructured data." <https://docs.snowflake.com/en/user-guide/unstructured-intro>
[^ac]: Snowflake Docs, "Overview of access control." <https://docs.snowflake.com/en/user-guide/security-access-control-overview>
[^sec]: Snowflake Docs, "USE SECONDARY ROLES." <https://docs.snowflake.com/en/sql-reference/sql/use-secondary-roles>
[^rights]: Snowflake Docs, "Understanding caller's rights and owner's rights stored procedures." <https://docs.snowflake.com/en/developer-guide/stored-procedure/stored-procedures-rights>
[^mfa]: Snowflake Docs, "Multi-factor authentication (MFA)." <https://docs.snowflake.com/en/user-guide/security-mfa>
[^kp]: Snowflake Docs, "Key-pair authentication and key-pair rotation." <https://docs.snowflake.com/en/user-guide/key-pair-auth>
[^fed]: Snowflake Docs, "Overview of federated authentication and SSO." <https://docs.snowflake.com/en/user-guide/admin-security-fed-auth-overview>
[^oauth]: Snowflake Docs, "Introduction to OAuth." <https://docs.snowflake.com/en/user-guide/oauth-intro>
[^ddm]: Snowflake Docs, "Understanding Dynamic Data Masking." <https://docs.snowflake.com/en/user-guide/security-column-ddm-intro>
[^rap]: Snowflake Docs, "Understanding row access policies." <https://docs.snowflake.com/en/user-guide/security-row-intro>
[^agg]: Snowflake Docs, "Aggregation policies." <https://docs.snowflake.com/en/user-guide/aggregation-policies>
[^proj]: Snowflake Docs, "Projection policies." <https://docs.snowflake.com/en/user-guide/projection-policies>
[^tags]: Snowflake Docs, "Introduction to object tagging." <https://docs.snowflake.com/en/user-guide/object-tagging/introduction>
[^lineage]: Snowflake Docs, "Data Lineage." <https://docs.snowflake.com/en/user-guide/ui-snowsight-lineage>
[^enc]: Snowflake Docs, "Understanding Encryption Key Management in Snowflake." <https://docs.snowflake.com/en/user-guide/security-encryption-manage>
[^trust]: Snowflake Docs, "Trust Center." <https://docs.snowflake.com/en/user-guide/trust-center/overview>
[^alerts]: Snowflake Docs, "Setting up alerts based on data in Snowflake." <https://docs.snowflake.com/en/user-guide/alerts>
[^rm]: Snowflake Docs, "Working with resource monitors." <https://docs.snowflake.com/en/user-guide/resource-monitors>
[^au]: Snowflake Docs, "Account Usage." <https://docs.snowflake.com/en/sql-reference/account-usage>
[^qp]: Snowflake Docs, "Monitor query activity with Query History (Query Profile)." <https://docs.snowflake.com/en/user-guide/ui-snowsight-activity>
[^qi]: Snowflake Docs, "Using query insights to improve performance." <https://docs.snowflake.com/en/user-guide/query-insights>
[^qah]: Snowflake Docs, "QUERY_ATTRIBUTION_HISTORY view." <https://docs.snowflake.com/en/sql-reference/account-usage/query_attribution_history>
[^qas]: Snowflake Docs, "Using the Query Acceleration Service." <https://docs.snowflake.com/en/user-guide/query-acceleration-service>
[^sos]: Snowflake Docs, "Search optimization service." <https://docs.snowflake.com/en/user-guide/search-optimization-service>
[^ck]: Snowflake Docs, "Clustering Keys & Clustered Tables." <https://docs.snowflake.com/en/user-guide/tables-clustering-keys>
[^mv]: Snowflake Docs, "Working with Materialized Views." <https://docs.snowflake.com/en/user-guide/views-materialized>
[^rc]: Snowflake Docs, "Using persisted query results." <https://docs.snowflake.com/en/user-guide/querying-persisted-results>
[^ttp]: Snowflake Docs, "Understanding & using Time Travel." <https://docs.snowflake.com/en/user-guide/data-time-travel>
[^fs]: Snowflake Docs, "Understanding and viewing Fail-safe." <https://docs.snowflake.com/en/user-guide/data-failsafe>
[^clone]: Snowflake Docs, "Cloning considerations." <https://docs.snowflake.com/en/user-guide/object-clone>
[^trunc]: Snowflake Docs, "TRUNCATE TABLE." <https://docs.snowflake.com/en/sql-reference/sql/truncate-table>
[^repl]: Snowflake Docs, "Introduction to replication and failover across multiple accounts." <https://docs.snowflake.com/en/user-guide/account-replication-intro>
[^share]: Snowflake Docs, "About Secure Data Sharing." <https://docs.snowflake.com/en/user-guide/data-sharing-intro>
[^reader]: Snowflake Docs, "Manage reader accounts." <https://docs.snowflake.com/en/user-guide/data-sharing-reader-create>
[^oep]: (Unofficial) Open Exam Prep, "SnowPro Core Exam Guide 2026 (COF-C03)." <https://open-exam-prep.com/blog/snowpro-core-certification-exam-guide-2026>
[^devto]: (Unofficial) S. PS, "SnowPro Core COF-C03 vs COF-C02: What Changed," *DEV Community*, 2026. <https://dev.to/sajeevsebastian/snowpro-core-cof-c03-vs-cof-c02-what-changed-49le>
